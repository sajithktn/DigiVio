import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { IN_MEMORY_ORDERS, OrderRecord } from '../src/modules/orders/orders.service.js';

describe('Feature 17: Reports & Analytics + Archive Gate', () => {
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

    // Clear previous orders to have an exact controlled set of 5 known orders
    IN_MEMORY_ORDERS.clear();

    const order1: OrderRecord = {
      id: 'ord-f17-001',
      order_no: 'DH-2026-700001',
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
          order_id: 'ord-f17-001',
          product_id: 'prod-1',
          product_slug: 'custom-labels-stickers',
          product_name: 'Custom Labels',
          config: { width_mm: 90, height_mm: 50 },
          qty: 100,
          unit_price_minor: 500,
          line_total_minor: 50000,
        },
      ],
      history: [],
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-01T10:00:00Z',
    };

    const order2: OrderRecord = {
      id: 'ord-f17-002',
      order_no: 'DH-2026-700002',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'completed',
      payment_status: 'paid',
      subtotal_minor: 80000,
      tax_minor: 12203,
      total_minor: 80000,
      currency: 'INR',
      files_unlocked: true,
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-2',
          order_id: 'ord-f17-002',
          product_id: 'prod-2',
          product_slug: 'tyvek-race-numbers',
          product_name: 'Himalayan Ultra Marathon Bibs',
          config: { width_mm: 210, height_mm: 148 },
          qty: 200,
          unit_price_minor: 400,
          line_total_minor: 80000,
        },
      ],
      history: [],
      created_at: '2026-04-02T11:00:00Z',
      updated_at: '2026-04-02T11:00:00Z',
    };

    const order3: OrderRecord = {
      id: 'ord-f17-003',
      order_no: 'DH-2026-700003',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'production',
      payment_status: 'paid',
      subtotal_minor: 120000,
      tax_minor: 18305,
      total_minor: 120000,
      currency: 'INR',
      files_unlocked: true,
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-3',
          order_id: 'ord-f17-003',
          product_id: 'prod-3',
          product_slug: 'mtb-handlebar-plates',
          product_name: 'MTB Handlebar Plates',
          config: { width_mm: 180, height_mm: 140 },
          qty: 50,
          unit_price_minor: 2400,
          line_total_minor: 120000,
        },
      ],
      history: [],
      created_at: '2026-04-03T12:00:00Z',
      updated_at: '2026-04-03T12:00:00Z',
    };

    const order4: OrderRecord = {
      id: 'ord-f17-004',
      order_no: 'DH-2026-700004',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'quote',
      payment_status: 'unpaid',
      subtotal_minor: 35000,
      tax_minor: 5339,
      total_minor: 35000,
      currency: 'INR',
      files_unlocked: false,
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-4',
          order_id: 'ord-f17-004',
          product_id: 'prod-4',
          product_slug: 'self-inking-stamps',
          product_name: 'Self-Inking Stamp',
          config: { width_mm: 40, height_mm: 40 },
          qty: 2,
          unit_price_minor: 17500,
          line_total_minor: 35000,
        },
      ],
      history: [],
      created_at: '2026-04-04T13:00:00Z',
      updated_at: '2026-04-04T13:00:00Z',
    };

    const order5: OrderRecord = {
      id: 'ord-f17-005',
      order_no: 'DH-2026-700005',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'cancelled',
      payment_status: 'refunded',
      subtotal_minor: 45000,
      tax_minor: 6864,
      total_minor: 45000,
      currency: 'INR',
      files_unlocked: false,
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-5',
          order_id: 'ord-f17-005',
          product_id: 'prod-5',
          product_slug: 'acrylic-wooden-trophies',
          product_name: 'Acrylic Wooden Trophy',
          config: { width_mm: 150, height_mm: 200 },
          qty: 10,
          unit_price_minor: 4500,
          line_total_minor: 45000,
        },
      ],
      history: [],
      created_at: '2026-04-05T14:00:00Z',
      updated_at: '2026-04-05T14:00:00Z',
    };

    IN_MEMORY_ORDERS.set(order1.id, order1);
    IN_MEMORY_ORDERS.set(order2.id, order2);
    IN_MEMORY_ORDERS.set(order3.id, order3);
    IN_MEMORY_ORDERS.set(order4.id, order4);
    IN_MEMORY_ORDERS.set(order5.id, order5);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('Insert 5 known orders → revenue/total counts match hand calculation', async () => {
    const res = await fetch(
      `${baseUrl}/api/admin/reports?from=2026-04-01T00:00:00Z&to=2026-04-06T00:00:00Z`,
      { headers: { Authorization: 'Bearer test-admin-token' } }
    );

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);

    const data = json.data;
    // Hand calculation: exactly 5 orders in date range
    expect(data.total_orders).toBe(5);

    // Hand calculation: paid orders only (ord-1: 50000, ord-2: 80000, ord-3: 120000) = 250000 paise
    expect(data.revenue_minor).toBe(250000);

    // Orders by status
    expect(data.orders_by_status.completed).toBe(2);
    expect(data.orders_by_status.production).toBe(1);
    expect(data.orders_by_status.quote).toBe(1);
    expect(data.orders_by_status.cancelled).toBe(1);
  });

  it('Throughput per division sums to total orders', async () => {
    const res = await fetch(`${baseUrl}/api/admin/reports`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const json = await res.json();
    expect(json.ok).toBe(true);

    const throughput = json.data.throughput_by_division;
    const sumThroughput = Object.values(throughput).reduce(
      (sum: number, count: any) => sum + Number(count),
      0
    );

    expect(sumThroughput).toBe(json.data.total_orders);
    expect(sumThroughput).toBe(5);
  });

  it('Revenue excludes unpaid / cancelled', async () => {
    const res = await fetch(`${baseUrl}/api/admin/reports`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Total gross of all 5 orders = 50000 + 80000 + 120000 + 35000 + 45000 = 330000
    // Unpaid (35000) + cancelled (45000) = 80000
    // Net recognized revenue = 250000
    expect(json.data.revenue_minor).toBe(250000);
    expect(json.data.revenue_minor).not.toBe(330000);
  });

  it('Archive search finds a completed event order by name', async () => {
    // 1. Unfiltered archive returns all completed orders (exactly 2)
    const resAll = await fetch(`${baseUrl}/api/admin/archive`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonAll = await resAll.json();
    expect(resAll.status).toBe(200);
    expect(jsonAll.ok).toBe(true);
    expect(jsonAll.data.count).toBe(2);
    expect(jsonAll.data.archive.every((o: any) => o.status === 'completed')).toBe(true);

    // 2. Query search by event order title "Himalayan Ultra Marathon"
    const resSearch = await fetch(`${baseUrl}/api/admin/archive?q=Himalayan Ultra Marathon`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonSearch = await resSearch.json();
    expect(resSearch.status).toBe(200);
    expect(jsonSearch.ok).toBe(true);
    expect(jsonSearch.data.count).toBe(1);
    expect(jsonSearch.data.archive[0].order_no).toBe('DH-2026-700002');
    expect(jsonSearch.data.archive[0].items[0].product_name).toContain('Himalayan Ultra Marathon');
  });

  it('Non-admin receives 403 Forbidden on reports and archive', async () => {
    const endpoints = ['/api/admin/reports', '/api/admin/archive'];
    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: 'Bearer test-customer-token' },
      });
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    }
  });
});
