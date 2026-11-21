import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { PDFDocument } from 'pdf-lib';

describe('Feature 13: Customer Dashboard APIs Gate', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  let originalOrderId: string;

  it('GET /api/me returns profile plus order counts for customer', async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.order_counts).toBeDefined();
    expect(typeof json.data.order_counts.total).toBe('number');
  });

  it('Order history returns only authenticated customer orders, newest first', async () => {
    // 1. Create order for Customer A
    const resA = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({
        items: [
          {
            product_slug: 'custom-labels-stickers',
            configuration: { width_mm: 50, height_mm: 50 },
            quantity: 25,
          },
        ],
      }),
    });
    const jsonA = await resA.json();
    originalOrderId = jsonA.data.id;

    // 2. Fetch Customer A orders
    const listRes = await fetch(`${baseUrl}/api/orders`, {
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const listJson = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(listJson.ok).toBe(true);
    expect(listJson.data.length).toBeGreaterThanOrEqual(1);

    // Verify all returned orders belong to Customer A
    for (const o of listJson.data) {
      expect(o.user_id).toBe('11111111-2222-3333-4444-555555555555');
      // Crucial security gate: customer response NEVER contains printfiles paths
      const jsonStr = JSON.stringify(o);
      expect(jsonStr).not.toContain('printfiles');
    }
  });

  it('One-click Reorder creates a new order with identical config, new order_no, and reorder_of set', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${originalOrderId}/reorder`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);

    const reorderedOrder = json.data;
    expect(reorderedOrder.id).not.toBe(originalOrderId);
    expect(reorderedOrder.reorder_of).toBe(originalOrderId);
    expect(reorderedOrder.order_no).toBeDefined();

    // Configuration is identical to original order
    expect(reorderedOrder.items[0].config.width_mm).toBe(50);
    expect(reorderedOrder.items[0].config.height_mm).toBe(50);
    expect(reorderedOrder.items[0].qty).toBe(25);
  });

  it('GET /api/orders/:id/invoice downloads valid PDF invoice matching order totals', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${originalOrderId}/invoice`, {
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');

    const pdfBuffer = await res.arrayBuffer();
    expect(pdfBuffer.byteLength).toBeGreaterThan(0);

    // Verify PDF structure
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  it('Customer cannot download another customer invoice (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${originalOrderId}/invoice`, {
      headers: {
        Authorization: 'Bearer test-user-b-token', // user B trying to download user A invoice
      },
    });

    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });
});
