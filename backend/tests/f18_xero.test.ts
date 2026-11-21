import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { IN_MEMORY_ORDERS, OrderRecord } from '../src/modules/orders/orders.service.js';
import { XeroApiProvider } from '../src/modules/accounting/xero-provider.js';
import Papa from 'papaparse';

describe('Feature 18: Accounting Export (Xero-ready) Gate', () => {
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

    IN_MEMORY_ORDERS.clear();

    const orderPaid1: OrderRecord = {
      id: 'ord-f18-001',
      order_no: 'DH-2026-800001',
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
          order_id: 'ord-f18-001',
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
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-04-10T10:00:00Z',
    };

    const orderPaid2: OrderRecord = {
      id: 'ord-f18-002',
      order_no: 'DH-2026-800002',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'production',
      payment_status: 'paid',
      subtotal_minor: 75000,
      tax_minor: 11441,
      total_minor: 75000,
      currency: 'INR',
      files_unlocked: true,
      shipping_address: {},
      billing_address: {},
      items: [
        {
          id: 'item-2',
          order_id: 'ord-f18-002',
          product_id: 'prod-2',
          product_slug: 'tyvek-race-numbers',
          product_name: 'Tyvek Event Numbers',
          config: { width_mm: 210, height_mm: 148 },
          qty: 250,
          unit_price_minor: 300,
          line_total_minor: 75000,
        },
      ],
      history: [],
      created_at: '2026-04-11T12:00:00Z',
      updated_at: '2026-04-11T12:00:00Z',
    };

    const orderUnpaid: OrderRecord = {
      id: 'ord-f18-003',
      order_no: 'DH-2026-800003',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'quote',
      payment_status: 'unpaid',
      subtotal_minor: 30000,
      tax_minor: 4576,
      total_minor: 30000,
      currency: 'INR',
      files_unlocked: false,
      shipping_address: {},
      billing_address: {},
      items: [],
      history: [],
      created_at: '2026-04-12T14:00:00Z',
      updated_at: '2026-04-12T14:00:00Z',
    };

    const orderCancelled: OrderRecord = {
      id: 'ord-f18-004',
      order_no: 'DH-2026-800004',
      user_id: '11111111-2222-3333-4444-555555555555',
      status: 'cancelled',
      payment_status: 'refunded',
      subtotal_minor: 40000,
      tax_minor: 6102,
      total_minor: 40000,
      currency: 'INR',
      files_unlocked: false,
      shipping_address: {},
      billing_address: {},
      items: [],
      history: [],
      created_at: '2026-04-13T16:00:00Z',
      updated_at: '2026-04-13T16:00:00Z',
    };

    IN_MEMORY_ORDERS.set(orderPaid1.id, orderPaid1);
    IN_MEMORY_ORDERS.set(orderPaid2.id, orderPaid2);
    IN_MEMORY_ORDERS.set(orderUnpaid.id, orderUnpaid);
    IN_MEMORY_ORDERS.set(orderCancelled.id, orderCancelled);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('CSV opens in Excel; headers match exactly; totals equal order totals', async () => {
    const res = await fetch(`${baseUrl}/api/admin/export/xero`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');

    const arrayBuffer = await res.arrayBuffer();
    const rawBytes = Buffer.from(arrayBuffer);
    // Verify UTF-8 BOM exists for Excel encoding compatibility
    expect(rawBytes[0]).toBe(0xef);
    expect(rawBytes[1]).toBe(0xbb);
    expect(rawBytes[2]).toBe(0xbf);

    const csvText = rawBytes.toString('utf8');
    // Parse CSV
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    expect(parsed.errors.length).toBe(0);

    // Exact headers required by Xero Invoice import specification
    const expectedHeaders = [
      'ContactName',
      'EmailAddress',
      'InvoiceNumber',
      'InvoiceDate',
      'DueDate',
      'Description',
      'Quantity',
      'UnitAmount',
      'AccountCode',
      'TaxType',
      'Currency',
    ];
    expect(parsed.meta.fields).toEqual(expectedHeaders);

    // Check row contents
    const rows = parsed.data as any[];
    expect(rows.length).toBe(2);

    // Order 1 verification
    const row1 = rows.find((r) => r.InvoiceNumber === 'INV-2026-800001');
    expect(row1).toBeDefined();
    expect(row1.ContactName).toBe('Test Customer');
    expect(row1.EmailAddress).toBe('customer@test.com');
    expect(row1.Quantity).toBe('100');
    expect(row1.UnitAmount).toBe('5'); // 5.00 rupees * 100 = 500 rupees = 50000 paise
    expect(row1.Currency).toBe('INR');
    expect(row1.AccountCode).toBe('200');

    const total1 = Number(row1.Quantity) * Number(row1.UnitAmount);
    expect(total1).toBe(500); // 500 INR = 50000 minor paise

    // Order 2 verification
    const row2 = rows.find((r) => r.InvoiceNumber === 'INV-2026-800002');
    expect(row2).toBeDefined();
    expect(row2.Quantity).toBe('250');
    expect(row2.UnitAmount).toBe('3'); // 3.00 rupees * 250 = 750 rupees = 75000 paise
    const total2 = Number(row2.Quantity) * Number(row2.UnitAmount);
    expect(total2).toBe(750); // 750 INR = 75000 minor paise
  });

  it('Only paid orders exported', async () => {
    const res = await fetch(`${baseUrl}/api/admin/export/xero`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });

    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const rows = parsed.data as any[];

    // Ensure unpaid order (800003) and cancelled/refunded order (800004) are NOT exported
    expect(rows.some((r) => r.InvoiceNumber === 'INV-2026-800003')).toBe(false);
    expect(rows.some((r) => r.InvoiceNumber === 'INV-2026-800004')).toBe(false);
  });

  it('AccountingProvider interface and XeroApiProvider stub support extensible switch-on path', async () => {
    const xeroProvider = new XeroApiProvider({ tenantId: 'tenant-123' });
    expect(xeroProvider.name).toBe('XeroApiProvider');

    const result = await xeroProvider.syncInvoice('ord-f18-001');
    expect(result.success).toBe(true);
    expect(result.externalId).toBe('xero-stub-ord-f18-001');
  });

  it('Non-admin receives 403 Forbidden on export', async () => {
    const res = await fetch(`${baseUrl}/api/admin/export/xero`, {
      headers: { Authorization: 'Bearer test-customer-token' },
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });
});
