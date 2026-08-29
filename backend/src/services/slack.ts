import axios from 'axios';
import { prisma } from './db';

export interface NotifyRateLimitOptions {
  tenantId: string;
  senderName: string;
  senderEmail: string;
  maxLimit: number;
  queuedCount: number;
  nextWindowTime: string;
}

export async function sendSlackRateLimitNotification(opts: NotifyRateLimitOptions): Promise<void> {
  try {
    const slackIntegration = await prisma.slackIntegration.findUnique({
      where: { tenantId: opts.tenantId },
    });

    if (!slackIntegration || !slackIntegration.webhookUrl) {
      console.log(`ℹ️ No Slack integration found for tenant '${opts.tenantId}', skipping notification silently.`);
      return;
    }

    const messagePayload = {
      text: `⚠️ *Hourly Rate Limit Triggered on ReachInbox*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ Email Hourly Rate Limit Exceeded',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender:*\n${opts.senderName} (${opts.senderEmail})`,
            },
            {
              type: 'mrkdwn',
              text: `*Hourly Limit:*\n${opts.maxLimit} emails/hour`,
            },
            {
              type: 'mrkdwn',
              text: `*Queued for Next Window:*\n${opts.queuedCount} email(s)`,
            },
            {
              type: 'mrkdwn',
              text: `*Next Sending Window:*\n${opts.nextWindowTime}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `ReachInbox Email Job Scheduler • Tenant ID: \`${opts.tenantId}\``,
            },
          ],
        },
      ],
    };

    await axios.post(slackIntegration.webhookUrl, messagePayload);
    console.log(`✅ Slack notification sent successfully to tenant '${opts.tenantId}' webhook.`);
  } catch (err: any) {
    console.error(`⚠️ Failed to send Slack notification for tenant '${opts.tenantId}':`, err.message || err);
    // Silent skip as specified in prompt (no crash, no breaking job processing)
  }
}
