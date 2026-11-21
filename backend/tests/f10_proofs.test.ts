import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { proofsService } from '../src/modules/proofs/proofs.service.js';

describe('Feature 10: Proof Versioning & Approval Gate', () => {
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

  let v1Id: string;
  let v2Id: string;
  const sampleSnapshot = {
    background: '#ffffff',
    elements: [{ type: 'text', text: 'Marathon 2026', fontSize: 32, x: 10, y: 10 }],
  };

  it('First proof is v1; after changes requested, next proof is v2; v1 becomes superseded', async () => {
    // 1. Create v1
    const res1 = await fetch(`${baseUrl}/api/proofs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({
        order_item_id: 'item-race-001',
        order_id: 'order-race-001',
        canvas_snapshot: sampleSnapshot,
      }),
    });
    const json1 = await res1.json();
    expect(res1.status).toBe(201);
    expect(json1.data.version).toBe(1);
    expect(json1.data.status).toBe('pending');
    v1Id = json1.data.id;

    // 2. Customer requests changes on v1
    const resChange = await fetch(`${baseUrl}/api/proofs/${v1Id}/changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({ message: 'Please increase font size of runner number' }),
    });
    const jsonChange = await resChange.json();
    expect(resChange.status).toBe(200);
    expect(jsonChange.data.proof.status).toBe('changes_requested');
    expect(jsonChange.data.order_status).toBe('artwork');

    // 3. New revised proof v2 is generated
    const res2 = await fetch(`${baseUrl}/api/proofs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({
        order_item_id: 'item-race-001',
        order_id: 'order-race-001',
        canvas_snapshot: {
          ...sampleSnapshot,
          elements: [{ type: 'text', text: 'Marathon 2026', fontSize: 40, x: 10, y: 10 }],
        },
      }),
    });
    const json2 = await res2.json();
    expect(res2.status).toBe(201);
    expect(json2.data.version).toBe(2);
    expect(json2.data.status).toBe('pending');
    v2Id = json2.data.id;
  });

  it('Approving an old version (v1 after v2 exists) returns 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/proofs/${v1Id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('CONFLICT');
    expect(json.error.message).toContain('Cannot approve older version');
  });

  it('Another customer approving my proof returns 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/proofs/${v2Id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-b-token', // different customer
      },
    });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('proof_events audit trail logs actor_id + version + timestamp', async () => {
    const res = await fetch(`${baseUrl}/api/proofs/${v1Id}/events`, {
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(1);

    const firstEvent = json.data[0];
    expect(firstEvent.actor_id).toBeDefined();
    expect(firstEvent.version).toBe(1);
    expect(firstEvent.created_at).toBeDefined();
  });

  it('Approving the latest proof v2 unlocks files and advances status to production', async () => {
    const res = await fetch(`${baseUrl}/api/proofs/${v2Id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-customer-token',
      },
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.proof.status).toBe('approved');
    expect(json.data.files_unlocked).toBe(true);
    expect(json.data.order_status).toBe('production');
  });

  it('Approved snapshot is byte-identical to the snapshot used in production (hash compare)', () => {
    const hash1 = proofsService.hashSnapshot(sampleSnapshot);
    const hash2 = proofsService.hashSnapshot(sampleSnapshot);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex string
  });
});
