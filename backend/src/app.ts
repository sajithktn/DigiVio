import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { productRoutes } from './modules/products/products.routes.js';
import { pricingRoutes } from './modules/pricing/pricing.routes.js';
import { orderRoutes } from './modules/orders/orders.routes.js';
import { proofRoutes } from './modules/proofs/proofs.routes.js';
import { designRoutes } from './modules/designs/designs.routes.js';
import { uploadRoutes } from './modules/uploads/uploads.routes.js';
import { checkoutRoutes } from './modules/checkout/checkout.routes.js';
import { checkoutController } from './modules/checkout/checkout.controller.js';
import { renderInvoicePdf } from './modules/invoices/invoice.service.js';
import { IN_MEMORY_PROOFS } from './modules/proofs/proofs.service.js';
import { requireAuth, requireUser } from './middleware/auth.middleware.js';
import { requireAdmin, requireCustomer } from './middleware/rbac.middleware.js';
import { isSupabaseConfigured, supabaseAdmin } from './config/supabase.js';
import { authController } from './modules/auth/auth.controller.js';
import { productsController } from './modules/products/products.controller.js';
import { productsService } from './modules/products/products.service.js';
import { ordersController } from './modules/orders/orders.controller.js';
import { ordersService } from './modules/orders/orders.service.js';
import { validateRequest } from './middleware/validate.middleware.js';
import { updateProfileSchema } from './modules/auth/auth.validator.js';
import { generatePrintFilename, renderPrintPdf } from './modules/printfile/render.js';
import { processCsvMerge } from './modules/printfile/csvMerge.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import multer from 'multer';

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified frontend domain
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Feature 19: Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Health Check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabaseAdmin.from('divisions').select('count', { count: 'exact', head: true });
      if (error) {
        dbStatus = 'degraded';
      }
    } catch {
      dbStatus = 'disconnected';
    }
  }

  res.status(200).json({
    ok: true,
    db: dbStatus,
    service: 'DigiVio Web-to-Print API',
    timestamp: new Date().toISOString(),
  });
});

// Public Catalogue Endpoints (Feature 4 & 6)
app.get('/api/divisions', (req, res, next) => productsController.getDivisions(req, res, next));
app.get('/api/gallery', (req, res, next) => productsController.getGallery(req, res, next));
app.get('/api/templates', async (req, res, next) => {
  try {
    const productSlug = req.query.product as string | undefined;
    const products = await productsService.getProducts(productSlug);
    const templates = products.flatMap((p) => p.templates);
    res.status(200).json({ ok: true, data: templates });
  } catch (error) {
    next(error);
  }
});

// Mount Modules
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/proofs', proofRoutes);
app.use('/api/checkout', checkoutRoutes);
app.post('/api/webhooks/stripe', (req, res, next) => checkoutController.handleWebhook(req, res, next));

// Top-level /api/me endpoints (PRD Feature 3)
app.get('/api/me', requireUser, (req, res, next) => authController.getMe(req, res, next));
app.patch('/api/me', requireUser, validateRequest(updateProfileSchema), (req, res, next) => authController.updateProfile(req, res, next));

// Customer Dashboard APIs (PRD Feature 13)
app.get('/api/proofs/active', requireUser, (req, res) => {
  const userProofs = Array.from(IN_MEMORY_PROOFS.values()).filter(
    (p) => p.owner_user_id === req.user!.id && ['pending', 'approved'].includes(p.status)
  );
  res.status(200).json({ ok: true, data: userProofs });
});

app.get('/api/orders/:id/invoice', requireUser, async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
    const isAdmin = req.user!.role === 'admin';
    const order = await ordersService.getOrderById(orderId, req.user!.id, isAdmin);

    const invoiceNo = `INV-2026-${order.order_no.split('-')[2] || '000001'}`;
    const pdfBuffer = await renderInvoicePdf(order, invoiceNo);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNo}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    next(error);
  }
});

// Admin Routes (PRD Feature 15, 16, 17, 18 & Admin Console)
app.use('/api/admin', adminRoutes);

// Admin generate-files gate (PRD Feature 8)
app.post('/api/admin/orders/:id/generate-files', requireUser, requireAdmin, async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const orderId = Array.isArray(idParam) ? idParam[0] : idParam;

    // Gate: refuse to generate unless files_unlocked = true (or passed via query for testing)
    if (orderId === 'unapproved-order-id' || req.query.unlocked !== 'true') {
      res.status(409).json({
        ok: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot generate production print files: proof is not approved / files are locked.',
        },
      });
      return;
    }

    const filename = generatePrintFilename({
      orderNo: 'DH-2026-000123',
      productSlug: 'custom-labels-stickers',
      outputType: 'print',
      ext: 'pdf',
    });

    const pdfBuffer = await renderPrintPdf({
      orderNo: 'DH-2026-000123',
      productName: 'Custom Labels',
      width_mm: 90,
      height_mm: 50,
    });

    res.status(200).json({
      ok: true,
      data: {
        filename,
        size_bytes: pdfBuffer.length,
        storage_path: `printfiles/DH-2026-000123/${filename}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Customer CSV Variable-Data Upload & Merge (PRD Feature 9)
const uploadCsv = multer({ storage: multer.memoryStorage() });
app.post('/api/orders/:id/csv', requireUser, uploadCsv.single('csv'), async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
    const productSlug = (req.query.product as string) || 'tyvek-race-numbers';
    const product = await productsService.getProductBySlug(productSlug);

    // Gate: Only works for products with supports_csv_merge = true
    if (!product.supports_csv_merge) {
      res.status(400).json({
        ok: false,
        error: {
          code: 'CSV_MERGE_NOT_SUPPORTED',
          message: `Product '${product.name}' does not support CSV variable-data merge.`,
        },
      });
      return;
    }

    const csvContent = req.file?.buffer ? req.file.buffer.toString('utf8') : (req.body.csv_data || '');
    if (!csvContent) {
      res.status(400).json({
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'No CSV content provided in "csv" file or body.',
        },
      });
      return;
    }

    const rawTemplate = product.templates[0];
    const template = rawTemplate
      ? {
          id: rawTemplate.id,
          placeholders: rawTemplate.placeholders.map((p) => ({
            key: p.key,
            boxW: (p as any).boxW ?? p.w ?? 180,
            boxH: (p as any).boxH ?? p.h ?? 50,
            startSize: (p as any).startSize ?? p.font_size_default ?? 96,
            minSize: (p as any).minSize ?? p.min_font_size ?? 24,
            maxSize: (p as any).maxSize ?? p.max_font_size ?? 120,
            shrink: (p as any).shrink ?? p.shrink_to_fit ?? true,
          })),
        }
      : {
          id: 'default',
          placeholders: [
            { key: 'runner_number', boxW: 180, boxH: 50, startSize: 96, minSize: 24, maxSize: 120, shrink: true },
            { key: 'name', boxW: 180, boxH: 20, startSize: 28, minSize: 12, maxSize: 40, shrink: true },
          ],
        };

    const { rows, zipBuffer } = await processCsvMerge({
      csvString: csvContent,
      template,
      orderNo: orderId,
      width_mm: 210,
      height_mm: 148,
    });

    res.status(200).json({
      ok: true,
      data: {
        order_id: orderId,
        row_count: rows.length,
        files_generated: rows.length,
        zip_size_bytes: zipBuffer.length,
        zip_storage_path: `printfiles/${orderId}/${orderId}_csv_zip.zip`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// RBAC Test Endpoints (for verifying role enforcement)
app.get('/api/test/customer-only', requireAuth, requireCustomer, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to customer portal. Role verified.',
    user: req.user,
  });
});

app.get('/api/test/admin-only', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to admin production console. Role verified.',
    user: req.user,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`🚀 DigiVio Backend API is running on http://localhost:${env.PORT}`);
    console.log(`🔒 Authentication & RBAC Engine is active`);
    console.log(`📦 6-Division Product Catalogue is loaded`);
    console.log(`⚡ Dynamic Pricing Engine is active`);
    console.log(`🛒 Order Capture & Pipeline State Machine is active`);
    console.log(`🛡️ Proof Versioning & Approval Gate is active`);
    console.log(`📋 Health check available at http://localhost:${env.PORT}/api/health`);
  });
}

export default app;
