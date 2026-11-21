import { env } from '../../config/env.js';

export interface EmailTemplateParams {
  orderNo: string;
  customerName?: string;
  totalINR?: string;
  proofUrl?: string;
  notes?: string;
}

const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';

export const emailTemplates = {
  orderConfirmed: (params: EmailTemplateParams): { subject: string; html: string } => ({
    subject: `Order Confirmed: ${params.orderNo}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #211B27;">
        <h2 style="color: #7542D8;">Order Confirmed — ${params.orderNo}</h2>
        <p>Thank you for your order. We have received your payment of ₹${params.totalINR || '0.00'}.</p>
        <p>Our production prep team is preparing your initial digital proof.</p>
        <p><a href="${frontendUrl}/orders/${params.orderNo}" style="background-color: #7542D8; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">View Order Status</a></p>
      </div>
    `,
  }),

  proofReady: (params: EmailTemplateParams): { subject: string; html: string } => ({
    subject: `Action Required: Digital Proof Ready for ${params.orderNo}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #211B27;">
        <h2 style="color: #7542D8;">Your Proof is Ready for Review</h2>
        <p>Your digital proof for order <strong>${params.orderNo}</strong> is ready for inspection.</p>
        <p>To guarantee zero production errors, printing files remain locked until you review and approve the proof.</p>
        <p><a href="${params.proofUrl || `${frontendUrl}/orders/${params.orderNo}/proof`}" style="background-color: #7542D8; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review & Approve Proof</a></p>
      </div>
    `,
  }),

  proofApproved: (params: EmailTemplateParams): { subject: string; html: string } => ({
    subject: `Proof Approved — ${params.orderNo} Sent to Production`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #211B27;">
        <h2 style="color: #16A34A;">Proof Approved</h2>
        <p>Thank you for approving your proof. Order <strong>${params.orderNo}</strong> has unlocked production files and entered our print pipeline.</p>
      </div>
    `,
  }),

  changesRequested: (params: EmailTemplateParams): { subject: string; html: string } => ({
    subject: `Changes Requested on Order ${params.orderNo}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #211B27;">
        <h2 style="color: #7542D8;">Customer Change Request</h2>
        <p>The customer has requested revisions for order <strong>${params.orderNo}</strong>.</p>
        <p><strong>Notes:</strong> ${params.notes || 'No notes provided.'}</p>
      </div>
    `,
  }),

  orderCompleted: (params: EmailTemplateParams): { subject: string; html: string } => ({
    subject: `Order Completed & Dispatched: ${params.orderNo}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #211B27;">
        <h2 style="color: #16A34A;">Order Dispatched!</h2>
        <p>Your print job <strong>${params.orderNo}</strong> is complete and on its way.</p>
      </div>
    `,
  }),
};
