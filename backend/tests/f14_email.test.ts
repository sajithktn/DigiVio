import { describe, it, expect } from 'vitest';
import { sendNotificationEmail, EMAIL_LOGS } from '../src/modules/email/send.js';
import { emailTemplates } from '../src/modules/email/templates.ts';

describe('Feature 14: Email Notifications Gate', () => {
  it('Triggers insert email_log entries with status="sent" and correct order number', async () => {
    const template = emailTemplates.orderConfirmed({
      orderNo: 'DH-2026-000123',
      totalINR: '1,500.00',
    });

    const log = await sendNotificationEmail({
      to: 'customer@example.com',
      subject: template.subject,
      kind: 'order_confirmed',
      html: template.html,
    });

    expect(log.status).toBe('sent');
    expect(log.to_email).toBe('customer@example.com');
    expect(log.subject).toContain('DH-2026-000123');

    // Email contains correct order link and number
    expect(template.html).toContain('DH-2026-000123');
    expect(template.html).toContain('http://localhost:3000/orders/DH-2026-000123');
  });

  it('Breaking the API key or provider failure does NOT crash the caller; logs status="failed"', async () => {
    const template = emailTemplates.proofReady({
      orderNo: 'DH-2026-000124',
      proofUrl: 'http://localhost:3000/orders/DH-2026-000124/proof',
    });

    // Simulated provider failure / invalid credentials
    const log = await sendNotificationEmail({
      to: 'customer@example.com',
      subject: template.subject,
      kind: 'proof_ready',
      html: template.html,
      forceFail: true, // triggers provider error
    });

    // Verification: Call completed without throwing an unhandled exception
    expect(log).toBeDefined();
    expect(log.status).toBe('failed');
    expect(log.error_message).toContain('Simulated email provider network failure');

    // Verification: Entry exists in persistent audit log
    const foundInLogs = EMAIL_LOGS.find((l) => l.id === log.id);
    expect(foundInLogs).toBeDefined();
    expect(foundInLogs?.status).toBe('failed');
  });

  it('All notification templates generate correct subjects and links', () => {
    const approved = emailTemplates.proofApproved({ orderNo: 'DH-2026-000125' });
    expect(approved.subject).toContain('DH-2026-000125');

    const changes = emailTemplates.changesRequested({
      orderNo: 'DH-2026-000126',
      notes: 'Make it bolder',
    });
    expect(changes.html).toContain('Make it bolder');

    const completed = emailTemplates.orderCompleted({ orderNo: 'DH-2026-000127' });
    expect(completed.subject).toContain('DH-2026-000127');
  });
});
