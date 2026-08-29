import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config/env';
import { prisma } from '../services/db';

const router = Router();

// GET /api/auth/slack/connect
router.get('/connect', (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string) || 'default_tenant';

  if (!config.slackClientId) {
    // If no client ID configured, allow easy simulated connection for dev
    const mockWebhook = `${config.frontendUrl.replace('3000', '5000')}/api/auth/slack/mock-webhook`;
    return res.redirect(`/api/auth/slack/callback?code=mock_code&state=${tenantId}&mockUrl=${encodeURIComponent(mockWebhook)}`);
  }

  const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${config.slackClientId}&scope=incoming-webhook&redirect_uri=${encodeURIComponent(
    config.slackRedirectUri
  )}&state=${tenantId}`;

  res.redirect(slackUrl);
});

// GET /api/auth/slack/callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state: tenantId, mockUrl } = req.query;
    const tenant = (tenantId as string) || 'default_tenant';

    let webhookUrl = '';

    if (mockUrl && typeof mockUrl === 'string') {
      webhookUrl = mockUrl;
    } else if (code) {
      // Exchange authorization code for access token + incoming webhook
      const response = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          client_id: config.slackClientId,
          client_secret: config.slackClientSecret,
          code: code as string,
          redirect_uri: config.slackRedirectUri,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Slack OAuth failed');
      }

      webhookUrl = response.data.incoming_webhook?.url;
    }

    if (!webhookUrl) {
      return res.status(400).send('Failed to obtain Slack incoming webhook URL.');
    }

    // Upsert SlackIntegration in PostgreSQL
    await prisma.slackIntegration.upsert({
      where: { tenantId: tenant },
      update: { webhookUrl, connectedAt: new Date() },
      create: { tenantId: tenant, webhookUrl },
    });

    console.log(`✅ Slack Integration connected for tenant '${tenant}': ${webhookUrl}`);
    res.redirect(`${config.frontendUrl}/dashboard?slack=connected`);
  } catch (err: any) {
    console.error('Slack OAuth Callback Error:', err.message || err);
    res.redirect(`${config.frontendUrl}/dashboard?slack=error`);
  }
});

// GET /api/auth/slack/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const tenantId = (req.query.tenantId as string) || 'default_tenant';
    const integration = await prisma.slackIntegration.findUnique({
      where: { tenantId },
    });

    res.json({
      success: true,
      connected: !!integration,
      integration: integration || null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/slack/mock-webhook
router.post('/mock-webhook', (req: Request, res: Response) => {
  console.log('🔔 [MOCK SLACK WEBHOOK RECEIVED]:', JSON.stringify(req.body, null, 2));
  res.status(200).send('ok');
});

export default router;
