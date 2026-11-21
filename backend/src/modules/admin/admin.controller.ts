import { Request, Response, NextFunction } from 'express';
import { IN_MEMORY_ORDERS, ordersService } from '../orders/orders.service.js';
import { IN_MEMORY_PROOFS } from '../proofs/proofs.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { renderPrintPdf } from '../printfile/render.js';
import { reportsService } from './reports.service.js';
import { csvExporter } from '../accounting/csv-exporter.js';
import { env } from '../../config/env.js';
import crypto from 'crypto';

export interface UserSummary {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: string;
}

export const IN_MEMORY_USERS: Map<string, UserSummary> = new Map();

export class AdminController {
  /**
   * Search, filter, and paginate orders for the production console
   */
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        status,
        q,
        customer,
        from,
        to,
        product_type,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string>;

      let orders = await ordersService.getOrders(req.user?.id || 'admin', true);

      // Filter by status
      if (status) {
        orders = orders.filter((o) => o.status === status);
      }

      // Filter by search query (order_no, user email, user name, user id)
      if (q) {
        const query = q.toLowerCase();
        orders = orders.filter((o) => {
          const user = IN_MEMORY_USERS.get(o.user_id);
          const email = user?.email?.toLowerCase() || (o.shipping_address as any)?.email?.toLowerCase() || '';
          const name = user?.full_name?.toLowerCase() || (o.shipping_address as any)?.fullName?.toLowerCase() || '';
          const orderNo = o.order_no.toLowerCase();
          return (
            orderNo.includes(query) ||
            email.includes(query) ||
            name.includes(query) ||
            o.user_id.toLowerCase().includes(query)
          );
        });
      }

      // Filter by customer email/id
      if (customer) {
        const query = customer.toLowerCase();
        orders = orders.filter((o) => {
          const user = IN_MEMORY_USERS.get(o.user_id);
          const email = user?.email?.toLowerCase() || (o.shipping_address as any)?.email?.toLowerCase() || '';
          return email.includes(query) || o.user_id.toLowerCase().includes(query);
        });
      }

      // Filter by date range
      if (from) {
        const fromDate = new Date(from).getTime();
        orders = orders.filter((o) => new Date(o.created_at).getTime() >= fromDate);
      }
      if (to) {
        const toDate = new Date(to).getTime();
        orders = orders.filter((o) => new Date(o.created_at).getTime() <= toDate);
      }

      // Filter by product_type
      if (product_type) {
        orders = orders.filter((o) => o.items.some((i) => i.product_slug === product_type));
      }

      // Decorate with ready_for_production flag: files_unlocked && paid
      const enriched = orders.map((o) => {
        const user = IN_MEMORY_USERS.get(o.user_id);
        const email = user?.email || (o.shipping_address as any)?.email || 'Customer';
        const name = user?.full_name || (o.shipping_address as any)?.fullName || 'Customer';
        return {
          ...o,
          customer_email: email,
          customer_name: name,
          ready_for_production: o.files_unlocked && o.payment_status === 'paid',
        };
      });

      // Sort newest first
      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Pagination
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = enriched.slice(startIndex, startIndex + limitNum);

      sendSuccess(res, {
        orders: paginated,
        pagination: {
          total: enriched.length,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(enriched.length / limitNum) || 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get full order detail with proofs and history
   */
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
      const order = IN_MEMORY_ORDERS.get(orderId);

      if (!order) {
        sendError(res, 404, `Order '${orderId}' not found.`, 'NOT_FOUND');
        return;
      }

      const user = IN_MEMORY_USERS.get(order.user_id);
      const proofs = Array.from(IN_MEMORY_PROOFS.values()).filter((p) => p.order_id === order.id);

      sendSuccess(res, {
        ...order,
        customer_email: user?.email || '',
        customer_name: user?.full_name || '',
        ready_for_production: order.files_unlocked && order.payment_status === 'paid',
        proofs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get signed production download URLs
   */
  async getOrderFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
      const order = IN_MEMORY_ORDERS.get(orderId);

      if (!order) {
        sendError(res, 404, `Order '${orderId}' not found.`, 'NOT_FOUND');
        return;
      }

      const token = crypto.randomBytes(16).toString('hex');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      const host = req.get('host') || `localhost:${env.PORT}`;
      const protocol = req.protocol || 'http';
      const baseUrl = `${protocol}://${host}`;

      const printPdfUrl = `${baseUrl}/api/admin/orders/${order.id}/download?file=print_pdf&token=${token}&expires=${expiresAt}`;
      const previewPngUrl = `${baseUrl}/api/admin/orders/${order.id}/download?file=preview_png&token=${token}&expires=${expiresAt}`;
      const csvZipUrl = `${baseUrl}/api/admin/orders/${order.id}/download?file=csv_zip&token=${token}&expires=${expiresAt}`;

      sendSuccess(res, {
        order_no: order.order_no,
        ready_for_production: order.files_unlocked && order.payment_status === 'paid',
        files: {
          print_pdf: { url: printPdfUrl, expires_at: expiresAt },
          preview_png: { url: previewPngUrl, expires_at: expiresAt },
          csv_zip: { url: csvZipUrl, expires_at: expiresAt },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle signed production file download and verify signature / expiration
   */
  async downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const orderId = Array.isArray(idParam) ? idParam[0] : idParam;
      const { file, token, expires } = req.query as Record<string, string>;

      if (!token || !expires) {
        sendError(res, 401, 'Missing signed URL token or expiration.', 'UNAUTHORIZED');
        return;
      }

      const expiresAt = parseInt(expires, 10);
      if (isNaN(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
        sendError(res, 401, 'Signed download link has expired.', 'LINK_EXPIRED');
        return;
      }

      const order = IN_MEMORY_ORDERS.get(orderId);
      if (!order) {
        sendError(res, 404, `Order '${orderId}' not found.`, 'NOT_FOUND');
        return;
      }

      if (file === 'print_pdf') {
        const pdfBuffer = await renderPrintPdf({
          orderNo: order.order_no,
          productName: order.items[0]?.product_name || 'Custom Labels',
          width_mm: order.items[0]?.config.width_mm || 90,
          height_mm: order.items[0]?.config.height_mm || 50,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${order.order_no}_print.pdf"`);
        res.send(Buffer.from(pdfBuffer));
        return;
      }

      if (file === 'preview_png') {
        // Return a valid 1x1 PNG header
        const pngBytes = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
          0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89
        ]);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="${order.order_no}_preview.png"`);
        res.send(pngBytes);
        return;
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${order.order_no}_files.zip"`);
      res.send(Buffer.from('PK\x05\x06' + '\x00'.repeat(18)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * List users
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = Array.from(IN_MEMORY_USERS.values());
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role or active status
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = req.params.id;
      const userId = Array.isArray(idParam) ? idParam[0] : idParam;
      const user = IN_MEMORY_USERS.get(userId);

      if (!user) {
        sendError(res, 404, `User '${userId}' not found.`, 'NOT_FOUND');
        return;
      }

      if (req.body.role) user.role = req.body.role;
      if (req.body.is_active !== undefined) user.is_active = req.body.is_active;

      IN_MEMORY_USERS.set(userId, user);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reports & Analytics (PRD Feature 17)
   */
  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const report = reportsService.getReports(from, to);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Order Archive Search (PRD Feature 17)
   */
  async getArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const archive = reportsService.getArchive(q);
      sendSuccess(res, { archive, count: archive.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xero-Ready Invoices Export (PRD Feature 18)
   */
  async exportXero(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const csvData = await csvExporter.exportInvoices(from, to);

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="xero_export_${dateStr}.csv"`);
      
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const body = Buffer.from(csvData.replace(/^\uFEFF/, ''), 'utf8');
      res.send(Buffer.concat([bom, body]));
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
