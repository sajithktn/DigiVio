import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';

describe('Feature 16: Admin Catalogue & Template Management Gate', () => {
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

  it('Admin adds a new material → appears in GET /api/products/[slug] and pricing quote immediately', async () => {
    // 1. Admin adds a new material to custom-labels-stickers
    const addMatRes = await fetch(`${baseUrl}/api/admin/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        name: 'Brushed Gold Poly',
        rate_per_cm2_minor: 5.5,
      }),
    });

    const addMatJson = await addMatRes.json();
    expect(addMatRes.status).toBe(201);
    expect(addMatJson.ok).toBe(true);
    expect(addMatJson.data.name).toBe('Brushed Gold Poly');
    expect(addMatJson.data.rate_per_cm2_minor).toBe(5.5);

    // 2. Fetch product by slug publicly: new material must appear immediately
    const prodRes = await fetch(`${baseUrl}/api/products/custom-labels-stickers`);
    const prodJson = await prodRes.json();
    expect(prodRes.status).toBe(200);
    expect(prodJson.ok).toBe(true);

    const goldMat = prodJson.data.materials.find((m: any) => m.name === 'Brushed Gold Poly');
    expect(goldMat).toBeDefined();
    expect(goldMat.rate_per_cm2_minor).toBe(5.5);

    // 3. Request pricing quote using the newly added material
    // 100mm x 100mm = 100 cm2. Rate = 5.5.
    // unit_base = 50 + 100 * 5.5 = 600 paise.
    // Qty 100 discount = 5%. unit_price = 600 * 0.95 = 570 paise.
    // subtotal = 570 * 100 + 1500 (setup) = 58500 paise.
    const quoteRes = await fetch(`${baseUrl}/api/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        width_mm: 100,
        height_mm: 100,
        qty: 100,
        material_id: 'Brushed Gold Poly',
      }),
    });

    const quoteJson = await quoteRes.json();
    expect(quoteRes.status).toBe(200);
    expect(quoteJson.ok).toBe(true);
    expect(quoteJson.data.unit_price).toBe(570);
    expect(quoteJson.data.subtotal).toBe(58500);
    expect(quoteJson.data.total).toBe(58500);
  });

  it('Adding a new division + product requires no code change (scalability proof)', async () => {
    // 1. Check initial division count
    const divListResBefore = await fetch(`${baseUrl}/api/divisions`);
    const divListJsonBefore = await divListResBefore.json();
    const initialDivCount = divListJsonBefore.data.length;

    // 2. Admin adds a brand new division (7th division)
    const addDivRes = await fetch(`${baseUrl}/api/admin/divisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        slug: 'signage-boards',
        name: 'Signage & Rigid Boards',
        description: 'Large format outdoor and exhibition sign panels',
        sort_order: initialDivCount + 1,
      }),
    });

    const addDivJson = await addDivRes.json();
    expect(addDivRes.status).toBe(201);
    expect(addDivJson.ok).toBe(true);
    expect(addDivJson.data.slug).toBe('signage-boards');

    // 3. Verify public GET /api/divisions has the new division without restart
    const divListResAfter = await fetch(`${baseUrl}/api/divisions`);
    const divListJsonAfter = await divListResAfter.json();
    expect(divListJsonAfter.data.length).toBe(initialDivCount + 1);
    const addedDiv = divListJsonAfter.data.find((d: any) => d.slug === 'signage-boards');
    expect(addedDiv).toBeDefined();

    // 4. Admin adds a product into the new division
    const addProdRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        division_slug: 'signage-boards',
        slug: 'corflute-signs-5mm',
        name: '5mm Corflute Signs',
        description: 'Weatherproof corrugated plastic estate and event signs',
        pricing_model: 'area',
        base_price_minor: 500,
        setup_fee_minor: 2500,
        min_qty: 5,
        max_qty: 1000,
        min_width_mm: 100,
        max_width_mm: 2400,
        min_height_mm: 100,
        max_height_mm: 1200,
        materials: [
          { id: 'm-cf-1', name: 'Standard 5mm Flute', rate_per_cm2_minor: 0.5, is_active: true },
        ],
      }),
    });

    const addProdJson = await addProdRes.json();
    expect(addProdRes.status).toBe(201);
    expect(addProdJson.ok).toBe(true);
    expect(addProdJson.data.slug).toBe('corflute-signs-5mm');

    // 5. Query public catalogue filtered by new division
    const catRes = await fetch(`${baseUrl}/api/products?division=signage-boards`);
    const catJson = await catRes.json();
    expect(catRes.status).toBe(200);
    expect(catJson.data.some((p: any) => p.slug === 'corflute-signs-5mm')).toBe(true);

    // 6. Get product details directly
    const itemRes = await fetch(`${baseUrl}/api/products/corflute-signs-5mm`);
    const itemJson = await itemRes.json();
    expect(itemRes.status).toBe(200);
    expect(itemJson.data.name).toBe('5mm Corflute Signs');

    // 7. Compute instant quote for new product
    const quoteRes = await fetch(`${baseUrl}/api/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_slug: 'corflute-signs-5mm',
        width_mm: 600,
        height_mm: 450,
        qty: 10,
      }),
    });
    const quoteJson = await quoteRes.json();
    expect(quoteRes.status).toBe(200);
    expect(quoteJson.ok).toBe(true);
    expect(quoteJson.data.total).toBeGreaterThan(0);
  });

  it('Invalid ranges (min > max) → 400', async () => {
    // 1. Product min_qty > max_qty
    const resQty = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        division_slug: 'labels-stickers',
        slug: 'bad-range-qty',
        name: 'Bad Range Qty',
        min_qty: 500,
        max_qty: 100, // min > max
      }),
    });
    expect(resQty.status).toBe(400);
    const jsonQty = await resQty.json();
    expect(jsonQty.ok).toBe(false);

    // 2. Product min_width_mm > max_width_mm
    const resWidth = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        division_slug: 'labels-stickers',
        slug: 'bad-range-width',
        name: 'Bad Range Width',
        min_width_mm: 1000,
        max_width_mm: 200, // min > max
      }),
    });
    expect(resWidth.status).toBe(400);
    const jsonWidth = await resWidth.json();
    expect(jsonWidth.ok).toBe(false);

    // 3. Product min_height_mm > max_height_mm
    const resHeight = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        division_slug: 'labels-stickers',
        slug: 'bad-range-height',
        name: 'Bad Range Height',
        min_height_mm: 500,
        max_height_mm: 100, // min > max
      }),
    });
    expect(resHeight.status).toBe(400);

    // 4. Volume discount tiers not strictly ascending
    const resDisc = await fetch(`${baseUrl}/api/admin/volume-discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        tiers: [
          { min_qty: 100, discount_percent: 5 },
          { min_qty: 50, discount_percent: 10 }, // 50 <= 100 (not ascending)
        ],
      }),
    });
    expect(resDisc.status).toBe(400);
    const jsonDisc = await resDisc.json();
    expect(jsonDisc.ok).toBe(false);

    // 5. Placeholder min_font_size > max_font_size
    const resFont = await fetch(`${baseUrl}/api/admin/placeholders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        template_id: '88888888-8888-4888-8888-888888888888',
        placeholder: {
          key: 'title',
          x: 10,
          y: 10,
          w: 40,
          h: 20,
          min_font_size: 48,
          max_font_size: 24, // min > max
        },
      }),
    });
    expect(resFont.status).toBe(400);

    // 6. Placeholder outside template print area
    // Template '88888888-8888-4888-8888-888888888888' print area is { x: 5, y: 5, w: 80, h: 40 }
    // x: 50 + w: 60 = 110 > areaRight (85)
    const resOutside = await fetch(`${baseUrl}/api/admin/placeholders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        template_id: '88888888-8888-4888-8888-888888888888',
        placeholder: {
          key: 'overflow_text',
          x: 50,
          y: 10,
          w: 60,
          h: 20,
          min_font_size: 10,
          max_font_size: 20,
        },
      }),
    });
    expect(resOutside.status).toBe(400);
    const jsonOutside = await resOutside.json();
    expect(jsonOutside.ok).toBe(false);
  });
});
