import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { AddressInfo } from 'net';
import app from '../src/app.js';

describe('Feature 3: Authentication, Roles & RLS Gate', () => {
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

  it('GET /api/me without token returns 401 with UNAUTHORIZED code', async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('Customer token calling /api/admin/orders returns 403 FORBIDDEN', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('Admin token calling /api/admin/orders succeeds with 200', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: {
        Authorization: 'Bearer test-admin-token',
      },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('Customer token calling /api/me returns their profile with role customer', async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data.role).toBe('customer');
  });

  it('RLS Migration (002_rls.sql) enforces user isolation on orders and designs', () => {
    const rlsPath = path.resolve(__dirname, '../../supabase/migrations/002_rls.sql');
    const rlsContent = fs.readFileSync(rlsPath, 'utf8');

    // Verify RLS is enabled on orders, profiles, and designs
    expect(rlsContent).toContain('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;');
    expect(rlsContent).toContain('ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;');
    expect(rlsContent).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');

    // Verify isolation policies
    expect(rlsContent).toContain('user_id = auth.uid() OR is_admin()');
    expect(rlsContent).toContain('id = auth.uid() OR is_admin()');
  });
});
