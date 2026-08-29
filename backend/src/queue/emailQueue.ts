import { Queue } from 'bullmq';
import { parseRedisUrl } from '../services/redis';
import { config } from '../config/env';

const connection = parseRedisUrl(config.redisUrl);

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export interface EnqueueEmailPayload {
  id: string;
  to: string;
  subject: string;
  body: string;
  senderId: string;
  scheduledAt: Date | string;
  tenantId?: string;
}

export async function enqueueEmailJob(email: EnqueueEmailPayload): Promise<void> {
  const scheduledTime = new Date(email.scheduledAt).getTime();
  const now = Date.now();
  const delay = Math.max(0, scheduledTime - now);

  await emailQueue.add(
    'send-email',
    { emailId: email.id },
    {
      jobId: email.id, // Strictly enforces idempotency in BullMQ
      delay,
    }
  );

  console.log(`📌 Enqueued email job ${email.id} (Delay: ${delay}ms, Scheduled: ${email.scheduledAt})`);
}
