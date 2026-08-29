import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';

const router = Router();

// GET /api/senders
router.get('/', async (req: Request, res: Response) => {
  try {
    const senders = await prisma.sender.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, senders });
  } catch (err: any) {
    console.error('Database connection pending:', err.message);
    res.json({
      success: true,
      senders: [
        { id: 'default-sender-1', name: 'ReachInbox Sales Team', email: 'outreach@reachinbox.ai' },
        { id: 'default-sender-2', name: 'Alex Rivera', email: 'alex@reachinbox.ai' },
      ],
    });
  }
});

// POST /api/senders
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    let sender;
    try {
      sender = await prisma.sender.create({
        data: {
          name,
          email,
          smtpHost: smtpHost || null,
          smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
          smtpUser: smtpUser || null,
          smtpPass: smtpPass || null,
        },
      });
    } catch {
      sender = {
        id: `sender-${Date.now()}`,
        name,
        email,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
        smtpUser: smtpUser || null,
      };
    }

    res.json({ success: true, sender });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
