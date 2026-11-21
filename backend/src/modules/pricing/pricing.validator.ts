import { z } from 'zod';

export const quoteRequestSchema = z.object({
  product_slug: z.string().min(1, 'Product slug is required'),
  width_mm: z.number().positive('Width in mm must be greater than zero'),
  height_mm: z.number().positive('Height in mm must be greater than zero'),
  qty: z
    .number({ invalid_type_error: 'Quantity must be a valid number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be greater than zero')
    .max(1000000, 'Quantity exceeds maximum allowed limit')
    .optional(),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a valid number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be greater than zero')
    .max(1000000, 'Quantity exceeds maximum allowed limit')
    .optional(),
  material_id: z.string().optional(),
  options: z.record(z.string()).optional(),
  finish_id: z.string().optional(),
  shape_id: z.string().optional(),
});

export const pricingCalculationSchema = quoteRequestSchema;
