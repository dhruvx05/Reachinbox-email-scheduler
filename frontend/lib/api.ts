import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Sender {
  id: string;
  name: string;
  email: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
}

export interface ScheduledEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  senderId: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  scheduledAt: string;
  sentAt?: string | null;
  createdAt: string;
  tenantId: string;
  etherealPreviewUrl?: string | null;
  sender?: Sender;
}

export interface SchedulePayload {
  to: string;
  subject: string;
  body: string;
  senderId: string;
  scheduledAt: string;
  tenantId?: string;
}

export const fetchEmails = async (status?: string): Promise<ScheduledEmail[]> => {
  const res = await api.get('/emails', { params: { status } });
  return res.data.emails || [];
};

export const fetchStats = async () => {
  const res = await api.get('/emails/stats');
  return res.data.stats || { scheduled: 0, sent: 0, failed: 0, total: 0 };
};

export const scheduleEmailsBatch = async (payloads: SchedulePayload[]) => {
  const res = await api.post('/emails/schedule', payloads);
  return res.data;
};

export const searchEmails = async (query: string): Promise<any[]> => {
  const res = await api.get('/emails/search', { params: { q: query } });
  return res.data.results || [];
};

export const fetchSenders = async (): Promise<Sender[]> => {
  const res = await api.get('/senders');
  return res.data.senders || [];
};

export const createSender = async (data: { name: string; email: string }) => {
  const res = await api.post('/senders', data);
  return res.data.sender;
};

export const getSlackStatus = async () => {
  const res = await api.get('/auth/slack/status');
  return res.data;
};
