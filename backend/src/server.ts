import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { config } from './config/env';
import { emailQueue } from './queue/emailQueue';
import { createEmailWorker, reconcileStuckProcessingJobs } from './queue/emailWorker';
import { initElasticsearchIndex } from './services/elasticsearch';

import emailRoutes from './routes/emailRoutes';
import senderRoutes from './routes/senderRoutes';
import searchRoutes from './routes/searchRoutes';
import slackRoutes from './routes/slackRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// BullMQ Live Dashboard setup with @bull-board/express
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/api/emails/search', searchRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/auth/slack', slackRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    workerConcurrency: config.workerConcurrency,
    minDelayMs: config.minDelayMs,
    maxEmailsPerHour: config.maxEmailsPerHourPerSender,
  });
});

async function startServer() {
  try {
    console.log('🚀 Starting ReachInbox Backend Engine...');

    // 1. Initialize Elasticsearch index
    await initElasticsearchIndex();

    // 2. Reconcile any stuck processing jobs from hard crash
    await reconcileStuckProcessingJobs();

    // 3. Start BullMQ worker
    const worker = createEmailWorker();
    console.log(`⚡ BullMQ Email Worker started (Concurrency: ${config.workerConcurrency}, Min Delay: ${config.minDelayMs}ms)`);

    // 4. Start HTTP Server
    app.listen(config.port, () => {
      console.log(`📡 Backend Server running on http://localhost:${config.port}`);
      console.log(`📊 BullMQ Live Dashboard mounted at http://localhost:${config.port}/admin/queues`);
    });
  } catch (err: any) {
    console.error('❌ Failed to start server:', err.message || err);
    process.exit(1);
  }
}

startServer();
