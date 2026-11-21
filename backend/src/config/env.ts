import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .default('5000')
    .transform((val) => parseInt(val, 10) || 5000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),
  FRONTEND_URL: z.string().optional().default('http://localhost:3000'),
  APP_URL: z.string().optional().default('http://localhost:5000'),

  // Supabase Database & Auth (credentials left empty until provided by user)
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),

  // Storage Buckets
  STORAGE_ARTWORK_BUCKET: z.string().optional().default('uploads'),
  STORAGE_PROOFS_BUCKET: z.string().optional().default('previews'),
  STORAGE_PRODUCTION_BUCKET: z.string().optional().default('printfiles'),
  STORAGE_INVOICES_BUCKET: z.string().optional().default('invoices'),
  STORAGE_GALLERY_BUCKET: z.string().optional().default('gallery'),

  // Stripe Payments
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),

  // Email Service
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('Digital Heroes <orders@digitalheroes.print>'),

  // Commercial / Tax Configuration
  TAX_RATE: z
    .string()
    .optional()
    .default('0.18')
    .transform((val) => parseFloat(val) || 0.18),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parseEnv = (): EnvConfig => {
  const raw = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    FRONTEND_URL: process.env.FRONTEND_URL,
    APP_URL: process.env.APP_URL,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    STORAGE_ARTWORK_BUCKET: process.env.STORAGE_ARTWORK_BUCKET,
    STORAGE_PROOFS_BUCKET: process.env.STORAGE_PROOFS_BUCKET,
    STORAGE_PRODUCTION_BUCKET: process.env.STORAGE_PRODUCTION_BUCKET,
    STORAGE_INVOICES_BUCKET: process.env.STORAGE_INVOICES_BUCKET,
    STORAGE_GALLERY_BUCKET: process.env.STORAGE_GALLERY_BUCKET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    EMAIL_FROM: process.env.EMAIL_FROM,
    TAX_RATE: process.env.TAX_RATE,
  };

  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.warn('⚠️ Warning: Environment variable parsing encountered issues:');
    result.error.issues.forEach((issue) => {
      console.warn(`  - [${issue.path.join('.')}] ${issue.message}`);
    });
    return {
      PORT: parseInt(process.env.PORT || '5000', 10) || 5000,
      NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
      APP_URL: process.env.APP_URL || 'http://localhost:5000',
      SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      STORAGE_ARTWORK_BUCKET: process.env.STORAGE_ARTWORK_BUCKET || 'uploads',
      STORAGE_PROOFS_BUCKET: process.env.STORAGE_PROOFS_BUCKET || 'previews',
      STORAGE_PRODUCTION_BUCKET: process.env.STORAGE_PRODUCTION_BUCKET || 'printfiles',
      STORAGE_INVOICES_BUCKET: process.env.STORAGE_INVOICES_BUCKET || 'invoices',
      STORAGE_GALLERY_BUCKET: process.env.STORAGE_GALLERY_BUCKET || 'gallery',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      RESEND_API_KEY: process.env.RESEND_API_KEY || '',
      EMAIL_FROM: process.env.EMAIL_FROM || 'Digital Heroes <orders@digitalheroes.print>',
      TAX_RATE: parseFloat(process.env.TAX_RATE || '0.18') || 0.18,
    };
  }
  return result.data;
};

export const env = parseEnv();
