import nodemailer from 'nodemailer';
import { config } from '../config/env';

let cachedTransporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) return cachedTransporter;

  if (config.etherealUser && config.etherealPass) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: config.etherealUser,
        pass: config.etherealPass,
      },
    });
    return cachedTransporter;
  }

  // Auto-create test Ethereal account if no env credentials provided
  console.log('Generating Ethereal SMTP test account...');
  const testAccount = await nodemailer.createTestAccount();
  console.log(`✨ Ethereal Email Account Created: ${testAccount.user}`);

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return cachedTransporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `"${opts.senderName}" <${opts.senderEmail}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.body,
    html: `<div style="font-family: sans-serif; padding: 16px;">${opts.body.replace(/\n/g, '<br/>')}</div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📩 Sent Email Preview URL: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
