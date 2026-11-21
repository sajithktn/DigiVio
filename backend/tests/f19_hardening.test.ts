import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { IN_MEMORY_ORDERS, OrderRecord } from '../src/modules/orders/orders.service.js';
import { productsService } from '../src/modules/products/products.service.js';
import { resetRateLimits } from '../src/middleware/rate-limit.middleware.js';

describe('Feature 19: Hardening, Errors & Security Gate', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    resetRateLimits();
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

  it('qty -1, 0, 1e9, "abc" → 400 each', async () => {
    const invalidQtys = [-1, 0, 1e9, 'abc'];

    for (const badQty of invalidQtys) {
      const res = await fetch(`${baseUrl}/api/pricing/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_slug: 'custom-labels-stickers',
          width_mm: 50,
          height_mm: 50,
          qty: badQty,
        }),
      });

      const json = await res.json();
      expect(res.status, `qty: ${badQty} should return 400`).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.error).toBeDefined();
      expect(json.stack).toBeUndefined();
    }
  });

  it('Reorder of a product that is now inactive → 409 with helpful message', async () => {
    // 1. Create a prior order with custom-labels-stickers
    const pastOrder: OrderRecord = {
      id: 'ord-f19-reorder-test',
      order_no: 'DH-2026-999001',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'completed',
      payment_status: 'paid',
      subtotal_minor: 50000,
      tax_minor: 7627,
      total_minor: 50000,
      currency: 'INR',
      files_unlocked: true,
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-1',
          order_id: 'ord-f19-reorder-test',
          product_id: 'prod-1',
          product_slug: 'custom-labels-stickers',
          product_name: 'Custom Contour Labels',
          config: { width_mm: 90, height_mm: 50, material_id: 'Gloss Vinyl' },
          qty: 100,
          unit_price_minor: 500,
          line_total_minor: 50000,
        },
      ],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    IN_MEMORY_ORDERS.set(pastOrder.id, pastOrder);

    // 2. Mark product as inactive in catalogue
    productsService.updateProduct('custom-labels-stickers', { is_active: false });

    // 3. Customer attempts to reorder
    const res = await fetch(`${baseUrl}/api/orders/${pastOrder.id}/reorder`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });

    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('CONFLICT');
    expect(json.error.message).toContain('inactive or discontinued');

    // 4. Restore product to active
    productsService.updateProduct('custom-labels-stickers', { is_active: true });
  });

  it('SQL-injection-style strings in search → no error/leak', async () => {
    const maliciousStrings = [
      "' OR '1'='1' --",
      "'; DROP TABLE orders; --",
      "admin'--",
      'UNION SELECT null, username, password FROM users--',
      '<script>alert("XSS")</script>',
    ];

    for (const attack of maliciousStrings) {
      // 1. Search in admin orders
      const resOrders = await fetch(
        `${baseUrl}/api/admin/orders?q=${encodeURIComponent(attack)}`,
        { headers: { Authorization: 'Bearer test-admin-token' } }
      );
      expect(resOrders.status).toBe(200);
      const jsonOrders = await resOrders.json();
      expect(jsonOrders.ok).toBe(true);

      // 2. Search in archive
      const resArchive = await fetch(
        `${baseUrl}/api/admin/archive?q=${encodeURIComponent(attack)}`,
        { headers: { Authorization: 'Bearer test-admin-token' } }
      );
      expect(resArchive.status).toBe(200);
      const jsonArchive = await resArchive.json();
      expect(jsonArchive.ok).toBe(true);

      // 3. Search public catalogue
      const resPublic = await fetch(
        `${baseUrl}/api/products?division=${encodeURIComponent(attack)}`
      );
      expect(resPublic.status).toBe(200);
      const jsonPublic = await resPublic.json();
      expect(jsonPublic.ok).toBe(true);
    }
  });

  it('100 rapid quote calls → rate-limit kicks in (429) only for abusive burst', async () => {
    let rateLimitedCount = 0;
    let okCount = 0;

    // Send 100 requests in a tight burst
    const requests = Array.from({ length: 100 }, () =>
      fetch(`${baseUrl}/api/pricing/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_slug: 'custom-labels-stickers',
          width_mm: 50,
          height_mm: 50,
          qty: 100,
        }),
      }).then(async (res) => {
        if (res.status === 429) {
          rateLimitedCount++;
          const json = await res.json();
          expect(json.ok).toBe(false);
          expect(json.error.code).toBe('TOO_MANY_REQUESTS');
          expect(res.headers.get('retry-after')).toBeDefined();
        } else if (res.status === 200) {
          okCount++;
        }
      })
    );

    await Promise.all(requests);

    // Initial requests within the threshold succeed, burst calls past 50 are blocked with 429
    expect(okCount).toBeGreaterThanOrEqual(40);
    expect(rateLimitedCount).toBeGreaterThan(0);
  });

  it('No stack traces in any error response and security headers present', async () => {
    resetRateLimits();
    const errorEndpoints = [
      { url: `${baseUrl}/api/products/non-existent-product-slug`, status: 404 },
      { url: `${baseUrl}/api/admin/orders`, headers: {}, status: 401 },
      { url: `${baseUrl}/api/admin/orders`, headers: { Authorization: 'Bearer test-customer-token' }, status: 403 },
      { url: `${baseUrl}/api/pricing/quote`, method: 'POST', body: JSON.stringify({ product_slug: '' }), status: 400 },
    ];

    for (const ep of errorEndpoints) {
      const res = await fetch(ep.url, {
        method: ep.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...(ep.headers || {}) },
        body: ep.body,
      });

      expect(res.status).toBe(ep.status);
      const text = await res.text();

      // Zero stack traces leaked in error responses
      expect(text).not.toContain('    at ');
      expect(text).not.toContain('node_modules');
      expect(text).not.toContain('.ts:');

      const json = JSON.parse(text);
      expect(json.ok).toBe(false);
      expect(json.error).toBeDefined();
      expect(json.error.stack).toBeUndefined();
      expect(json.stack).toBeUndefined();

      // Verify security headers
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('x-frame-options')).toBe('DENY');
    }
  });
});
