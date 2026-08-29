import { Worker, Job } from 'bullmq';
import { parseRedisUrl } from '../services/redis';
import { config } from '../config/env';
import { prisma } from '../services/db';
import { sendEmail } from '../services/mailer';
import { checkAndIncrementRateLimit } from '../services/rateLimiter';
import { sendSlackRateLimitNotification } from '../services/slack';
import { upsertEmailToElasticsearch } from '../services/elasticsearch';
import { EMAIL_QUEUE_NAME, emailQueue } from './emailQueue';

const connection = parseRedisUrl(config.redisUrl);

export function createEmailWorker(): Worker {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job<{ emailId: string }>, token) => {
      const { emailId } = job.data;

      // 1. Fetch email record from DB
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { sender: true },
      });

      if (!email) {
        console.warn(`⚠️ Job ${job.id} skipped: Email record ${emailId} not found in DB.`);
        return;
      }

      if (email.status === 'sent') {
        console.log(`ℹ️ Job ${job.id} skipped: Email ${emailId} already marked as sent.`);
        return;
      }

      // 2. Transition status to processing
      await prisma.email.update({
        where: { id: emailId },
        data: { status: 'processing' },
      });

      await upsertEmailToElasticsearch({
        id: email.id,
        to: email.to,
        subject: email.subject,
        body: email.body,
        status: 'processing',
        senderId: email.senderId,
        tenantId: email.tenantId,
        scheduledAt: email.scheduledAt,
        createdAt: email.createdAt,
      });

      // 3. Hourly rate limit check (per sender)
      const rateLimit = await checkAndIncrementRateLimit(email.senderId);

      if (!rateLimit.allowed) {
        console.warn(
          `⏱️ Rate limit hit for Sender ${email.sender.name} (${email.senderId}). Limit: ${config.maxEmailsPerHourPerSender}/hr.`
        );

        // Count how many emails are queued for this sender
        const queuedCount = await prisma.email.count({
          where: { senderId: email.senderId, status: { in: ['pending', 'processing'] } },
        });

        // Trigger Slack notification if first limit-hit event in this window
        if (rateLimit.shouldNotifySlack) {
          const nextWindowTimeStr = new Date(rateLimit.nextWindowMs!).toLocaleTimeString();
          await sendSlackRateLimitNotification({
            tenantId: email.tenantId,
            senderName: email.sender.name,
            senderEmail: email.sender.email,
            maxLimit: config.maxEmailsPerHourPerSender,
            queuedCount,
            nextWindowTime: nextWindowTimeStr,
          });
        }

        // Re-set DB status to pending so it can resume cleanly in next window
        await prisma.email.update({
          where: { id: emailId },
          data: { status: 'pending' },
        });

        await upsertEmailToElasticsearch({
          id: email.id,
          to: email.to,
          subject: email.subject,
          body: email.body,
          status: 'pending',
          senderId: email.senderId,
          tenantId: email.tenantId,
          scheduledAt: email.scheduledAt,
          createdAt: email.createdAt,
        });

        // Delay job until next hour window
        if (rateLimit.nextWindowMs && token) {
          await job.moveToDelayed(rateLimit.nextWindowMs, token);
          return;
        } else {
          throw new Error(`Rate limit exceeded. Job delayed for next hour window.`);
        }
      }

      // 4. Send Email via Nodemailer (Ethereal)
      try {
        const sendResult = await sendEmail({
          to: email.to,
          subject: email.subject,
          body: email.body,
          senderEmail: email.sender.email,
          senderName: email.sender.name,
        });

        const sentAt = new Date();
        const etherealPreviewUrl = sendResult.previewUrl || null;

        // 5. Update DB status to sent
        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: 'sent',
            sentAt,
            etherealPreviewUrl,
          },
        });

        await upsertEmailToElasticsearch({
          id: email.id,
          to: email.to,
          subject: email.subject,
          body: email.body,
          status: 'sent',
          senderId: email.senderId,
          tenantId: email.tenantId,
          scheduledAt: email.scheduledAt,
          sentAt,
          createdAt: email.createdAt,
        });

        console.log(`✅ Email ${emailId} successfully sent to ${email.to}`);
      } catch (sendErr: any) {
        console.error(`❌ Failed to send email ${emailId}:`, sendErr.message || sendErr);

        await prisma.email.update({
          where: { id: emailId },
          data: { status: 'failed' },
        });

        await upsertEmailToElasticsearch({
          id: email.id,
          to: email.to,
          subject: email.subject,
          body: email.body,
          status: 'failed',
          senderId: email.senderId,
          tenantId: email.tenantId,
          scheduledAt: email.scheduledAt,
          createdAt: email.createdAt,
        });

        throw sendErr;
      }
    },
    {
      connection,
      concurrency: config.workerConcurrency,
      limiter: {
        max: 1,
        duration: config.minDelayMs,
      },
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`🚨 Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * Startup hard-crash reconciliation:
 * Scans DB for emails stuck in 'processing' state (from a hard server crash mid-execution).
 * Marks them back to 'pending' and re-enqueues only if missing from BullMQ.
 */
export async function reconcileStuckProcessingJobs(): Promise<void> {
  try {
    const stuckEmails = await prisma.email.findMany({
      where: { status: 'processing' },
    });

    if (stuckEmails.length === 0) {
      console.log('⚡ No stuck processing jobs found during startup reconciliation.');
      return;
    }

    console.log(`🔄 Reconciling ${stuckEmails.length} job(s) stuck in 'processing' state...`);

    for (const email of stuckEmails) {
      const existingJob = await emailQueue.getJob(email.id);

      await prisma.email.update({
        where: { id: email.id },
        data: { status: 'pending' },
      });

      if (!existingJob) {
        console.log(`📌 Job ${email.id} missing from BullMQ after crash. Re-enqueueing...`);
        const scheduledTime = new Date(email.scheduledAt).getTime();
        const delay = Math.max(0, scheduledTime - Date.now());
        await emailQueue.add('send-email', { emailId: email.id }, { jobId: email.id, delay });
      } else {
        console.log(`⚡ Job ${email.id} still exists in BullMQ queue, status reset to pending.`);
      }
    }
  } catch (err: any) {
    console.error('⚠️ Error during job reconciliation:', err.message || err);
  }
}
