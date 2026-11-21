import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../src/app.js';
import { AddressInfo } from 'net';

describe('Feature 1: Health & Environment API Gate', () => {
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

  it('GET /api/health returns ok: true and db status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.db).toBeDefined();
    expect(data.service).toBe('DigiVio Web-to-Print API');
  });

  it('Unknown route returns 404 with standard error shape', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-endpoint`);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('NOT_FOUND');
  });
});
