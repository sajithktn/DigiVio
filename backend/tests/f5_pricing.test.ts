import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { calculatePrice } from '../src/modules/pricing/engine.js';

describe('Feature 5: Pure Pricing Engine & Quote API Gate', () => {
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

  const discounts = [
    { min_qty: 100, discount_percent: 5 },
    { min_qty: 250, discount_percent: 10 },
    { min_qty: 500, discount_percent: 15 },
    { min_qty: 1000, discount_percent: 20 },
  ];

  it('Boundary tests: qty 99 -> 0%, qty 100 -> 5%, qty 250 -> 10%, qty 1000 -> 20%', () => {
    const q99 = calculatePrice({
      width_mm: 100,
      height_mm: 100,
      qty: 99,
      base_price_minor: 50,
      setup_fee_minor: 1000,
      rate_per_cm2_minor: 1.5,
      volume_discounts: discounts,
    });
    expect(q99.discount_percent).toBe(0);

    const q100 = calculatePrice({
      width_mm: 100,
      height_mm: 100,
      qty: 100,
      base_price_minor: 50,
      setup_fee_minor: 1000,
      rate_per_cm2_minor: 1.5,
      volume_discounts: discounts,
    });
    expect(q100.discount_percent).toBe(5);

    const q250 = calculatePrice({
      width_mm: 100,
      height_mm: 100,
      qty: 250,
      base_price_minor: 50,
      setup_fee_minor: 1000,
      rate_per_cm2_minor: 1.5,
      volume_discounts: discounts,
    });
    expect(q250.discount_percent).toBe(10);

    const q1000 = calculatePrice({
      width_mm: 100,
      height_mm: 100,
      qty: 1000,
      base_price_minor: 50,
      setup_fee_minor: 1000,
      rate_per_cm2_minor: 1.5,
      volume_discounts: discounts,
    });
    expect(q1000.discount_percent).toBe(20);
  });

  it('Doubling area increases unit price proportionally based on rate_per_cm2', () => {
    // 100 x 50 mm = 50 cm²
    const p1 = calculatePrice({
      width_mm: 100,
      height_mm: 50,
      qty: 10,
      base_price_minor: 0,
      setup_fee_minor: 0,
      rate_per_cm2_minor: 2.0,
      volume_discounts: [],
    });

    // 100 x 100 mm = 100 cm² (double the area)
    const p2 = calculatePrice({
      width_mm: 100,
      height_mm: 100,
      qty: 10,
      base_price_minor: 0,
      setup_fee_minor: 0,
      rate_per_cm2_minor: 2.0,
      volume_discounts: [],
    });

    expect(p2.unit_price).toBe(p1.unit_price * 2);
  });

  it('Tax-inclusive: total === subtotal and tax_included matches manual 18% calculation', () => {
    const calc = calculatePrice({
      width_mm: 100,
      height_mm: 100,
      qty: 100,
      base_price_minor: 100,
      setup_fee_minor: 1500,
      rate_per_cm2_minor: 1.5,
      volume_discounts: discounts,
      tax_rate: 0.18,
    });

    expect(calc.total).toBe(calc.subtotal);

    // Formula: round(subtotal * 0.18 / 1.18)
    const expectedTax = Math.round((calc.subtotal * 0.18) / 1.18);
    expect(calc.tax_included).toBe(expectedTax);
  });

  it('All financial values returned are integers (paise)', () => {
    const calc = calculatePrice({
      width_mm: 73,
      height_mm: 49,
      qty: 137,
      base_price_minor: 33,
      setup_fee_minor: 1250,
      rate_per_cm2_minor: 1.33,
      volume_discounts: discounts,
      option_delta_minor: 17,
      option_multiplier: 1.05,
    });

    expect(Number.isInteger(calc.unit_price)).toBe(true);
    expect(Number.isInteger(calc.subtotal)).toBe(true);
    expect(Number.isInteger(calc.tax_included)).toBe(true);
    expect(Number.isInteger(calc.total)).toBe(true);
    expect(Number.isInteger(calc.savings)).toBe(true);
  });

  it('API POST /api/pricing/quote returns price quote without auth', async () => {
    const startTime = Date.now();
    const res = await fetch(`${baseUrl}/api/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        width_mm: 100,
        height_mm: 100,
        qty: 100,
        material_id: 'm-lbl-1',
        options: { finish: 'gloss_lam' },
      }),
    });
    const duration = Date.now() - startTime;
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.unit_price).toBeDefined();
    expect(json.data.total).toBeDefined();
    expect(json.data.currency).toBe('INR');
    expect(duration).toBeLessThan(1000); // Response time < 1000 ms even under parallel test worker load
  });

  it('API POST /api/pricing/quote with width below min returns 400 with clear message', async () => {
    const res = await fetch(`${baseUrl}/api/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        width_mm: 5, // min is 20mm
        height_mm: 100,
        qty: 50,
      }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.message).toContain('Width');
  });
});
