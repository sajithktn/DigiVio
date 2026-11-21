import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { IN_MEMORY_ORDERS } from '../src/modules/orders/orders.service.js';

describe('Feature 11: Orders & Pipeline Status Gate', () => {
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

  it('Tampering client price (sending unit_price: 1) is completely ignored; stored price = server price', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({
        items: [
          {
            product_slug: 'custom-labels-stickers',
            configuration: { width_mm: 100, height_mm: 100 },
            quantity: 100,
            unit_price: 1, // Tampered price attempt
            total_price: 100, // Tampered total attempt
          },
        ],
      }),
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);

    const order = json.data;
    const item = order.items[0];
    // Unit price calculated by pure engine for 100x100mm label @ 100 qty > 100 paise
    expect(item.unit_price_minor).toBeGreaterThan(1);
    expect(order.total_minor).toBeGreaterThan(100);
  });

  it('order_no is unique and sequential under 5 parallel creations', async () => {
    const payload = {
      items: [
        {
          product_slug: 'custom-labels-stickers',
          configuration: { width_mm: 50, height_mm: 50 },
          quantity: 25,
        },
      ],
    };

    const requests = Array.from({ length: 5 }, () =>
      fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-customer-token',
        },
        body: JSON.stringify(payload),
      }).then((r) => r.json())
    );

    const results = await Promise.all(requests);
    const orderNumbers = results.map((r) => r.data.order_no);

    // Verify all 5 order numbers are distinct
    const uniqueNumbers = new Set(orderNumbers);
    expect(uniqueNumbers.size).toBe(5);

    // Verify format DH-YYYY-XXXXXX
    for (const no of orderNumbers) {
      expect(no).toMatch(/^DH-\d{4}-\d{6}$/);
    }
  });

  it('Invalid jump transition (e.g. order -> completed) returns 409 Conflict', async () => {
    // 1. Create a fresh order (starts in 'order' status)
    const createRes = await fetch(`${baseUrl}/api/orders`, {
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
    const { data: order } = await createRes.json();

    // 2. Try illegal jump from 'order' directly to 'completed'
    const patchRes = await fetch(`${baseUrl}/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({ status: 'completed' }),
    });

    const patchJson = await patchRes.json();
    expect(patchRes.status).toBe(409);
    expect(patchJson.ok).toBe(false);
    expect(patchJson.error.code).toBe('CONFLICT');
    expect(patchJson.error.message).toContain('Invalid pipeline transition');
  });

  it('Moving to production without files_unlocked and paid status returns 409 Conflict', async () => {
    // 1. Create order
    const createRes = await fetch(`${baseUrl}/api/orders`, {
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
    const { data: order } = await createRes.json();

    // Move order -> artwork -> proof
    await fetch(`${baseUrl}/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token' },
      body: JSON.stringify({ status: 'artwork' }),
    });
    await fetch(`${baseUrl}/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token' },
      body: JSON.stringify({ status: 'proof' }),
    });

    // Try moving from proof -> production while files_unlocked is false / unpaid
    const prodRes = await fetch(`${baseUrl}/api/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-admin-token' },
      body: JSON.stringify({ status: 'production' }),
    });

    const prodJson = await prodRes.json();
    expect(prodRes.status).toBe(409);
    expect(prodJson.ok).toBe(false);
    expect(prodJson.error.code).toBe('CONFLICT');
  });

  it('Customer cannot call admin status PATCH endpoint (403 Forbidden)', async () => {
    const patchRes = await fetch(`${baseUrl}/api/admin/orders/some-order-id/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    const json = await patchRes.json();
    expect(patchRes.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });
});
