import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';

describe('DigiVio Complete Authentication Integration Tests', () => {
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

  // 1. Password & Input Validations
  it('Registration rejects weak password (missing uppercase/number or <8 chars)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        full_name: 'Test User',
        password: 'weak',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it('Registration rejects mismatched confirm_password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        full_name: 'Test User',
        password: 'Password123',
        confirm_password: 'Password999',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.message).toContain('match');
  });

  // 2. Protected routes without token
  it('16. Protected route access without authentication returns 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  // 3. Login with incorrect credentials
  it('8. Login with incorrect credentials returns 401 INVALID_CREDENTIALS', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody@example.com',
        password: 'WrongPassword123',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.ok).toBe(false);
  });

  // 4. Forgot password email request (Security: Does not reveal user existence)
  it('10. Forgot password returns confirmation message without leaking user existence', async () => {
    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'random-customer@digivio-print.com',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data.message).toContain('password reset link');
  });

  // 5. Resend verification email endpoint
  it('6. Resend verification email succeeds with valid email address', async () => {
    const res = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'pending-verify@digivio.print',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data.message).toBeDefined();
  });

  // 6. Reset password validation & token check
  it('12. Reset password rejects request when reset token is missing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'NewValidPassword123',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.code).toBe('BAD_REQUEST');
  });

  it('Reset password rejects mismatched confirm_password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token-123',
      },
      body: JSON.stringify({
        password: 'NewValidPassword123',
        confirm_password: 'DifferentPassword123',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.message).toContain('match');
  });

  // 7. Verified session access & Profile endpoints
  it('Customer session retrieves their own profile with role customer', async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.role).toBe('customer');
    expect(data.data.order_counts).toBeDefined();
  });

  it('15. Logout successfully terminates session', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.message).toContain('Logged out');
  });
});
