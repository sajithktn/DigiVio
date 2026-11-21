import { z } from 'zod';

export const shippingAddressSchema = z.object({
  recipient_name: z.string().min(2, 'Recipient name is required'),
  company_name: z.string().optional(),
  address_line1: z.string().min(3, 'Address line 1 is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  postal_code: z.string().min(2, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().optional(),
});

export const orderItemCreateSchema = z.object({
  product_slug: z.string().min(1, 'Product slug is required'),
  configuration: z.object({
    width_mm: z.number().positive(),
    height_mm: z.number().positive(),
    material_id: z.string().min(1),
    finish_id: z.string().optional(),
    shape_id: z.string().optional(),
    custom_addons: z.array(z.string()).optional(),
  }),
  quantity: z.number().int().positive(),
  artwork_source: z.enum(['designer', 'upload']),
  artwork_url: z.string().optional(),
  canvas_json: z.record(z.any()).optional(),
  has_variable_data: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemCreateSchema).min(1, 'Order must contain at least one item'),
  shipping_address: shippingAddressSchema,
  billing_address: shippingAddressSchema.optional(),
  payment_reference: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'quote',
    'order',
    'artwork',
    'proof',
    'production',
    'completed',
    'cancelled',
  ]),
});
