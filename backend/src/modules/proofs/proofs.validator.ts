import { z } from 'zod';

export const createProofRevisionSchema = z.object({
  order_item_id: z.string().uuid('Invalid order item ID format'),
  proof_preview_url: z.string().min(1, 'Proof preview URL or path is required'),
  notes: z.string().optional(),
});

export const requestRevisionSchema = z.object({
  feedback_notes: z
    .string()
    .min(5, 'Feedback notes must be at least 5 characters to help production staff understand the requested changes'),
});
