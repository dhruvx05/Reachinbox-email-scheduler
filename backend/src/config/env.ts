import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/reachinbox_db?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',

  etherealUser: process.env.ETHEREAL_USER || '',
  etherealPass: process.env.ETHEREAL_PASS || '',

  slackClientId: process.env.SLACK_CLIENT_ID || '',
  slackClientSecret: process.env.SLACK_CLIENT_SECRET || '',
  slackRedirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/auth/slack/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  minDelayMs: parseInt(process.env.MIN_DELAY_MS || '2000', 10),
  maxEmailsPerHourPerSender: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '5', 10),
};
