import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { IN_MEMORY_ORDERS, OrderRecord } from '../src/modules/orders/orders.service.js';
import { IN_MEMORY_USERS } from '../src/modules/admin/admin.controller.js';
import { PDFDocument } from 'pdf-lib';

describe('Feature 15: Admin Orders & Users Gate', () => {
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

    // Seed test users
    IN_MEMORY_USERS.set('11111111-2222-3333-4444-555555555555', {
      id: '11111111-2222-3333-4444-555555555555',
      email: 'customer@test.com',
      full_name: 'Customer A',
      role: 'customer',
      is_active: true,
      created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    });

    IN_MEMORY_USERS.set('22222222-3333-4444-5555-666666666666', {
      id: '22222222-3333-4444-5555-666666666666',
      email: 'user_b@test.com',
      full_name: 'Customer B',
      role: 'customer',
      is_active: true,
      created_at: new Date('2026-01-02T00:00:00Z').toISOString(),
    });

    // Seed test orders across various statuses and dates
    const order1: OrderRecord = {
      id: 'ord-f15-001',
      order_no: 'DH-2026-900001',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'quote',
      payment_status: 'unpaid',
      subtotal_minor: 50000,
      tax_minor: 7627,
      total_minor: 50000,
      currency: 'INR',
      files_unlocked: false,
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-1',
          order_id: 'ord-f15-001',
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
      created_at: '2026-03-01T10:00:00Z',
      updated_at: '2026-03-01T10:00:00Z',
    };

    const order2: OrderRecord = {
      id: 'ord-f15-002',
      order_no: 'DH-2026-900002',
      user_id: '22222222-3333-4444-5555-666666666666',
      status: 'proof',
      payment_status: 'paid',
      subtotal_minor: 75000,
      tax_minor: 11441,
      total_minor: 75000,
      currency: 'INR',
      files_unlocked: false, // Paid, but proof not approved yet
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-2',
          order_id: 'ord-f15-002',
          product_id: 'prod-2',
          product_slug: 'tyvek-race-numbers',
          product_name: 'Tyvek Race Numbers',
          config: { width_mm: 210, height_mm: 148 },
          qty: 250,
          unit_price_minor: 300,
          line_total_minor: 75000,
        },
      ],
      history: [],
      created_at: '2026-03-10T12:00:00Z',
      updated_at: '2026-03-10T12:00:00Z',
    };

    const order3: OrderRecord = {
      id: 'ord-f15-003',
      order_no: 'DH-2026-900003',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'production',
      payment_status: 'paid',
      subtotal_minor: 120000,
      tax_minor: 18305,
      total_minor: 120000,
      currency: 'INR',
      files_unlocked: true, // Both approved and paid!
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-3',
          order_id: 'ord-f15-003',
          product_id: 'prod-1',
          product_slug: 'custom-labels-stickers',
          product_name: 'Custom Labels',
          config: { width_mm: 90, height_mm: 50 },
          qty: 500,
          unit_price_minor: 240,
          line_total_minor: 120000,
        },
      ],
      history: [],
      created_at: '2026-03-15T15:00:00Z',
      updated_at: '2026-03-15T15:00:00Z',
    };

    IN_MEMORY_ORDERS.set(order1.id, order1);
    IN_MEMORY_ORDERS.set(order2.id, order2);
    IN_MEMORY_ORDERS.set(order3.id, order3);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('Non-admin -> 403 on all /api/admin/* endpoints', async () => {
    const endpoints = [
      { method: 'GET', path: '/api/admin/orders' },
      { method: 'GET', path: '/api/admin/orders/ord-f15-001' },
      { method: 'GET', path: '/api/admin/orders/ord-f15-001/files' },
      { method: 'GET', path: '/api/admin/users' },
      { method: 'PATCH', path: '/api/admin/users/11111111-2222-3333-4444-555555555555' },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-customer-token',
        },
        body: ep.method === 'PATCH' ? JSON.stringify({ is_active: false }) : undefined,
      });

      const json = await res.json();
      expect(res.status, `Endpoint ${ep.path} should return 403`).toBe(403);
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    }
  });

  it('Filter by status + date range + product type returns expected subset', async () => {
    // 1. Filter by status: proof
    const resStatus = await fetch(`${baseUrl}/api/admin/orders?status=proof`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonStatus = await resStatus.json();
    expect(resStatus.status).toBe(200);
    expect(jsonStatus.ok).toBe(true);
    expect(jsonStatus.data.orders.every((o: any) => o.status === 'proof')).toBe(true);
    expect(jsonStatus.data.orders.some((o: any) => o.id === 'ord-f15-002')).toBe(true);
    expect(jsonStatus.data.orders.some((o: any) => o.id === 'ord-f15-001')).toBe(false);

    // 2. Filter by product_type: tyvek-race-numbers
    const resProd = await fetch(`${baseUrl}/api/admin/orders?product_type=tyvek-race-numbers`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonProd = await resProd.json();
    expect(jsonProd.data.orders.length).toBe(1);
    expect(jsonProd.data.orders[0].id).toBe('ord-f15-002');

    // 3. Filter by date range: 2026-03-05 to 2026-03-12 (should only catch ord-f15-002)
    const resDate = await fetch(
      `${baseUrl}/api/admin/orders?from=2026-03-05T00:00:00Z&to=2026-03-12T00:00:00Z`,
      { headers: { Authorization: 'Bearer test-admin-token' } }
    );
    const jsonDate = await resDate.json();
    expect(jsonDate.data.orders.length).toBe(1);
    expect(jsonDate.data.orders[0].id).toBe('ord-f15-002');
  });

  it('Text search by order no / customer email works', async () => {
    // Search by order number
    const resOrderNo = await fetch(`${baseUrl}/api/admin/orders?q=900003`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonOrderNo = await resOrderNo.json();
    expect(jsonOrderNo.data.orders.length).toBe(1);
    expect(jsonOrderNo.data.orders[0].order_no).toBe('DH-2026-900003');

    // Search by customer email
    const resEmail = await fetch(`${baseUrl}/api/admin/orders?q=user_b@test.com`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonEmail = await resEmail.json();
    expect(jsonEmail.data.orders.length).toBe(1);
    expect(jsonEmail.data.orders[0].id).toBe('ord-f15-002');
    expect(jsonEmail.data.orders[0].customer_email).toBe('user_b@test.com');
  });

  it('ready_for_production is false before approval, true after approval + payment', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const json = await res.json();
    expect(json.ok).toBe(true);

    const orders = json.data.orders;
    const ord1 = orders.find((o: any) => o.id === 'ord-f15-001'); // unpaid, unapproved
    const ord2 = orders.find((o: any) => o.id === 'ord-f15-002'); // paid, unapproved
    const ord3 = orders.find((o: any) => o.id === 'ord-f15-003'); // paid, approved

    expect(ord1.ready_for_production).toBe(false);
    expect(ord2.ready_for_production).toBe(false);
    expect(ord3.ready_for_production).toBe(true);
  });

  it('Signed URL downloads a valid PDF and expires', async () => {
    // 1. Get signed URLs for order 3
    const resFiles = await fetch(`${baseUrl}/api/admin/orders/ord-f15-003/files`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonFiles = await resFiles.json();
    expect(resFiles.status).toBe(200);
    expect(jsonFiles.ok).toBe(true);
    expect(jsonFiles.data.files.print_pdf.url).toBeDefined();
    expect(jsonFiles.data.files.print_pdf.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));

    const signedUrl = jsonFiles.data.files.print_pdf.url;

    // 2. Download valid PDF from signed URL
    const resDownload = await fetch(signedUrl);
    expect(resDownload.status).toBe(200);
    expect(resDownload.headers.get('content-type')).toContain('application/pdf');

    const pdfBuffer = await resDownload.arrayBuffer();
    expect(pdfBuffer.byteLength).toBeGreaterThan(0);

    // Verify it is a valid PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    expect(pdfDoc.getPageCount()).toBeGreaterThan(0);

    // 3. Test expiration: tampering with expires timestamp to past
    const expiredUrl = signedUrl.replace(/expires=\d+/, 'expires=1000000000');
    const resExpired = await fetch(expiredUrl);
    expect(resExpired.status).toBe(401);
    const jsonExpired = await resExpired.json();
    expect(jsonExpired.ok).toBe(false);
    expect(jsonExpired.error.code).toBe('LINK_EXPIRED');
  });

  it('Admin users list and update active status and role', async () => {
    // GET /api/admin/users
    const resUsers = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    const jsonUsers = await resUsers.json();
    expect(resUsers.status).toBe(200);
    expect(Array.isArray(jsonUsers.data)).toBe(true);
    expect(jsonUsers.data.length).toBeGreaterThanOrEqual(2);

    // PATCH /api/admin/users/:id
    const targetUserId = '11111111-2222-3333-4444-555555555555';
    const resUpdate = await fetch(`${baseUrl}/api/admin/users/${targetUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({ is_active: false }),
    });
    const jsonUpdate = await resUpdate.json();
    expect(resUpdate.status).toBe(200);
    expect(jsonUpdate.data.is_active).toBe(false);

    // Restore active status
    await fetch(`${baseUrl}/api/admin/users/${targetUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({ is_active: true }),
    });
  });
});
