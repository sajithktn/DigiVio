import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';

describe('Feature 7: Designs & Uploads Gate', () => {
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

  let savedDesignId: string;

  it('Save design with an element outside print area clamps the element inside', async () => {
    const res = await fetch(`${baseUrl}/api/designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({
        product_slug: 'custom-labels-stickers',
        config: { width_mm: 100, height_mm: 50 },
        canvas_json: {
          elements: [
            // Element outside the 100 x 50 box
            { id: 'el-1', type: 'rect', x: 120, y: 60, w: 30, h: 20 },
          ],
        },
      }),
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    savedDesignId = json.data.id;

    // Check clamping: x + w <= 100, y + h <= 50
    const clampedEl = json.data.canvas_json.elements[0];
    expect(clampedEl.x + clampedEl.w).toBeLessThanOrEqual(100);
    expect(clampedEl.y + clampedEl.h).toBeLessThanOrEqual(50);
  });

  it('User A cannot GET User B design (403 Forbidden)', async () => {
    // Attempt to access with a different user token
    const res = await fetch(`${baseUrl}/api/designs/${savedDesignId}`, {
      headers: {
        Authorization: 'Bearer test-user-b-token', // different user
      },
    });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('Upload endpoint accepts .png and .pdf and generates signed URL with expiration', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="artwork"; filename="sample.png"\r\n` +
      `Content-Type: image/png\r\n\r\n` +
      `FakePNGData\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: 'Bearer test-customer-token',
      },
      body,
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.data.signed_url).toBeDefined();
    expect(json.data.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(json.data.filename).toContain('sample.png');
  });

  it('Upload rejects disallowed executable .exe with 400 error', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="artwork"; filename="malicious.exe"\r\n` +
      `Content-Type: application/x-msdownload\r\n\r\n` +
      `FakeEXEData\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${baseUrl}/api/uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: 'Bearer test-customer-token',
      },
      body,
    });

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.message).toContain('not allowed');
  });
});
