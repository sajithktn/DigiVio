import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { IN_MEMORY_ORDERS } from '../src/modules/orders/orders.service.js';
import { INVOICES_REGISTRY } from '../src/modules/checkout/checkout.service.js';

describe('Feature 12: Stripe Checkout & Webhook Gate', () => {
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

  let orderId: string;

  it('Creates Stripe Checkout session with valid session_id and redirect URL', async () => {
    // 1. Create order
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
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
    const orderJson = await orderRes.json();
    orderId = orderJson.data.id;

    // 2. Create Checkout Session
    const checkRes = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({ order_id: orderId }),
    });

    const checkJson = await checkRes.json();
    expect(checkRes.status).toBe(201);
    expect(checkJson.ok).toBe(true);
    expect(checkJson.data.session_id).toBeDefined();
    expect(checkJson.data.checkout_url).toContain('/checkout/success');
  });

  it('Webhook with bad signature returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid_signature',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.message).toContain('Invalid Stripe webhook signature');
  });

  it('Successful payment webhook (test card) sets order payment_status to paid, advances status to artwork, and issues invoice', async () => {
    const eventId = `evt_test_success_${Date.now()}`;
    const webhookPayload = {
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { order_id: orderId },
        },
      },
    };

    const res = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'valid_test_signature',
      },
      body: JSON.stringify(webhookPayload),
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    const updatedOrder = IN_MEMORY_ORDERS.get(orderId);
    expect(updatedOrder?.payment_status).toBe('paid');
    expect(updatedOrder?.status).toBe('artwork');

    const invoice = INVOICES_REGISTRY.get(orderId);
    expect(invoice).toBeDefined();
    expect(invoice?.invoice_no).toMatch(/^INV-\d{4}-\d+/);
  });

  it('Declined payment webhook sets payment_status to failed', async () => {
    const failedOrderId = `order-failed-${Date.now()}`;
    IN_MEMORY_ORDERS.set(failedOrderId, {
      id: failedOrderId,
      order_no: 'DH-2026-999999',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'order',
      payment_status: 'unpaid',
      subtotal_minor: 1500,
      tax_minor: 228,
      total_minor: 1500,
      currency: 'INR',
      files_unlocked: false,
      shipping_address: {},
      billing_address: {},
      items: [],
      history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const webhookPayload = {
      id: `evt_failed_${Date.now()}`,
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          order_id: failedOrderId,
        },
      },
    };

    const res = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'valid_test_signature',
      },
      body: JSON.stringify(webhookPayload),
    });

    const json = await res.json();
    expect(res.status).toBe(200);

    const order = IN_MEMORY_ORDERS.get(failedOrderId);
    expect(order?.payment_status).toBe('failed');
  });

  it('Same webhook event replayed twice is recognized as duplicate (idempotent)', async () => {
    const replayEventId = `evt_replay_${Date.now()}`;
    const webhookPayload = {
      id: replayEventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { order_id: orderId },
        },
      },
    };

    // First delivery
    const res1 = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'valid_test_signature',
      },
      body: JSON.stringify(webhookPayload),
    });
    const json1 = await res1.json();
    expect(json1.received).toBe(true);
    expect(json1.duplicate).toBeUndefined();

    // Second delivery (replay)
    const res2 = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'valid_test_signature',
      },
      body: JSON.stringify(webhookPayload),
    });
    const json2 = await res2.json();
    expect(json2.received).toBe(true);
    expect(json2.duplicate).toBe(true);
  });
});
