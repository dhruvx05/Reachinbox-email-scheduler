import { redisClient } from './redis';
import { config } from '../config/env';

export interface RateLimitCheckResult {
  allowed: boolean;
  count: number;
  nextWindowMs: number | null;
  shouldNotifySlack: boolean;
}

export function getHourlyWindowKey(senderId: string, dateObj: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const hour = pad(dateObj.getHours());
  return `ratelimit:${senderId}:${year}-${month}-${day}-${hour}`;
}

export function getNextHourTimestamp(dateObj: Date = new Date()): number {
  const nextHour = new Date(dateObj);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  return nextHour.getTime();
}

export async function checkAndIncrementRateLimit(senderId: string): Promise<RateLimitCheckResult> {
  const now = new Date();
  const dateStr = getHourlyWindowKey(senderId, now);
  const count = await redisClient.incr(dateStr);

  if (count === 1) {
    // Set 1-hour expiration for the new key
    await redisClient.expire(dateStr, 3600);
  }

  if (count > config.maxEmailsPerHourPerSender) {
    const nextWindowMs = getNextHourTimestamp(now);
    
    // Slack deduplication key to ensure notification is sent exactly ONCE per limit-hit event per window
    const slackDedupeKey = `ratelimit_slack_sent:${senderId}:${dateStr}`;
    const acquired = await redisClient.set(slackDedupeKey, '1', 'EX', 3600, 'NX');

    return {
      allowed: false,
      count,
      nextWindowMs,
      shouldNotifySlack: acquired === 'OK',
    };
  }

  return {
    allowed: true,
    count,
    nextWindowMs: null,
    shouldNotifySlack: false,
  };
}
