import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';

describe('Feature 4: Catalogue API Gate', () => {
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

  it('GET /api/divisions returns exactly 6 divisions sorted by sort_order without auth', async () => {
    const res = await fetch(`${baseUrl}/api/divisions`);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(6);

    // Verify sort order is ascending (1 through 6)
    for (let i = 0; i < json.data.length - 1; i++) {
      expect(json.data[i].sort_order).toBeLessThanOrEqual(json.data[i + 1].sort_order);
    }
  });

  it('GET /api/products/:slug returns materials, options, volume discounts, and size limits in one call', async () => {
    const res = await fetch(`${baseUrl}/api/products/custom-labels-stickers`);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);

    const product = json.data;
    expect(product.slug).toBe('custom-labels-stickers');
    expect(Array.isArray(product.materials)).toBe(true);
    expect(product.materials.length).toBeGreaterThan(0);
    expect(Array.isArray(product.options)).toBe(true);
    expect(Array.isArray(product.volume_discounts)).toBe(true);

    // Verify size limits
    expect(product.min_width_mm).toBeDefined();
    expect(product.max_width_mm).toBeDefined();
    expect(product.min_height_mm).toBeDefined();
    expect(product.max_height_mm).toBeDefined();
    expect(product.bleed_mm).toBeDefined();
    expect(product.print_dpi).toBe(300);
  });

  it('GET /api/products/:slug with unknown slug returns 404 with standard error shape', async () => {
    const res = await fetch(`${baseUrl}/api/products/non-existent-product-slug`);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/gallery returns showcase items without auth', async () => {
    const res = await fetch(`${baseUrl}/api/gallery`);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(6);
  });
});
