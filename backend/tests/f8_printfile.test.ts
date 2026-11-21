import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import {
  generatePrintFilename,
  calculatePixelDimensions,
  calculatePointDimensions,
  renderPrintPdf,
} from '../src/modules/printfile/render.js';
import { PDFDocument } from 'pdf-lib';

describe('Feature 8: Print-File Engine (PDF + PNG) Gate', () => {
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

  it('Sample 90x50mm label @300dpi with 3mm bleed gives exactly 1134 x 661 px', () => {
    const dims = calculatePixelDimensions(90, 50, 3, 300);
    expect(dims.width_px).toBe(1134);
    expect(dims.height_px).toBe(661);
  });

  it('Filename strictly matches OrderID_ProductType_Date_Output pattern', () => {
    const filename = generatePrintFilename({
      orderNo: 'DH-2026-000123',
      productSlug: 'race-numbers',
      date: new Date('2026-03-19'),
      outputType: 'print',
      ext: 'pdf',
    });

    expect(filename).toBe('DH-2026-000123_race-numbers_20260319_print.pdf');
    const regex = /^[A-Z0-9-]+_[a-z0-9-]+_\d{8}_[a-z0-9-]+\.[a-z0-9]+$/;
    expect(regex.test(filename)).toBe(true);
  });

  it('PDF generation creates valid PDF with page size matching trim + bleed in points', async () => {
    const ptDims = calculatePointDimensions(90, 50, 3);
    // (90 + 6) * 72 / 25.4 = 272.126
    // (50 + 6) * 72 / 25.4 = 158.740
    expect(Math.round(ptDims.width_pt)).toBe(272);
    expect(Math.round(ptDims.height_pt)).toBe(159);

    const pdfBuffer = await renderPrintPdf({
      orderNo: 'DH-2026-000123',
      productName: 'Custom Labels',
      width_mm: 90,
      height_mm: 50,
      bleed_mm: 3,
    });

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Verify it is a readable valid PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    expect(pages.length).toBe(1);

    const { width, height } = pages[0].getSize();
    expect(Math.round(width)).toBe(272);
    expect(Math.round(height)).toBe(159);
  });

  it('Calling generate-files on an order with unapproved proof returns 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders/unapproved-order-id/generate-files`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-admin-token',
      },
    });

    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('CONFLICT');
    expect(json.error.message).toContain('files are locked');
  });

  it('Generation completes well under 10 seconds Vercel serverless limit', async () => {
    const startTime = Date.now();
    await renderPrintPdf({
      orderNo: 'DH-2026-000124',
      productName: 'Fast Label',
      width_mm: 90,
      height_mm: 50,
      bleed_mm: 3,
    });
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000);
  });
});
