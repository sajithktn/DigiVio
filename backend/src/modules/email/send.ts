import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { supabaseAdmin, isSupabaseConfigured } from '../../config/supabase.js';
import crypto from 'crypto';

export interface EmailLogEntry {
  id: string;
  to_email: string;
  subject: string;
  kind: string;
  status: 'sent' | 'failed';
  error_message?: string;
  created_at: string;
}

export const EMAIL_LOGS: EmailLogEntry[] = [];

let resendClient: Resend | null = null;
if (env.RESEND_API_KEY && !env.RESEND_API_KEY.includes('placeholder')) {
  resendClient = new Resend(env.RESEND_API_KEY);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  kind: string;
  html: string;
  forceFail?: boolean; // For testing resilience
}

/**
 * Dispatches email notifications via Resend.
 * Critical safety rule: Email failures must NEVER crash or interrupt the calling request.
 */
export const sendNotificationEmail = async (input: SendEmailInput): Promise<EmailLogEntry> => {
  const { to, subject, kind, html, forceFail = false } = input;
  const timestamp = new Date().toISOString();
  const logId = crypto.randomUUID();

  try {
    if (forceFail) {
      throw new Error('Simulated email provider network failure / bad API key');
    }

    if (resendClient) {
      await resendClient.emails.send({
        from: env.EMAIL_FROM || 'Digital Heroes <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
    }

    const logEntry: EmailLogEntry = {
      id: logId,
      to_email: to,
      subject,
      kind,
      status: 'sent',
      created_at: timestamp,
    };

    EMAIL_LOGS.push(logEntry);

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('email_log').insert({
          id: logId,
          to_email: to,
          subject,
          kind,
          status: 'sent',
          created_at: timestamp,
        });
      } catch {
        // Safe fallback
      }
    }

    return logEntry;
  } catch (error: any) {
    console.warn(`⚠️ Email dispatch failed (${kind} to ${to}):`, error.message);

    const failedLogEntry: EmailLogEntry = {
      id: logId,
      to_email: to,
      subject,
      kind,
      status: 'failed',
      error_message: error.message,
      created_at: timestamp,
    };

    EMAIL_LOGS.push(failedLogEntry);

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('email_log').insert({
          id: logId,
          to_email: to,
          subject,
          kind,
          status: 'failed',
          created_at: timestamp,
        });
      } catch {
        // Safe fallback
      }
    }

    return failedLogEntry;
  }
};
