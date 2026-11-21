import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import app from '../src/app.js';
import { validateCsvData, processCsvMerge } from '../src/modules/printfile/csvMerge.js';

describe('Feature 9: CSV Variable-Data Merge Gate', () => {
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

  const template = {
    id: '77777777-7777-4777-7777-777777777777',
    placeholders: [
      { key: 'runner_number', boxW: 180, boxH: 50, startSize: 96, minSize: 24, maxSize: 120, shrink: true },
      { key: 'name', boxW: 180, boxH: 20, startSize: 28, minSize: 12, maxSize: 40, shrink: true },
    ],
  };

  it('CSV with 10 rows generates exactly 10 row outputs and 1 zip archive buffer', async () => {
    let csv = 'runner_number,name\n';
    for (let i = 1; i <= 10; i++) {
      csv += `${1000 + i},Runner ${i}\n`;
    }

    const { rows, zipBuffer } = await processCsvMerge({
      csvString: csv,
      template,
      orderNo: 'DH-2026-000123',
      width_mm: 210,
      height_mm: 148,
    });

    expect(rows.length).toBe(10);
    expect(rows[0].filename).toContain('_row0001');
    expect(rows[9].filename).toContain('_row0010');
    expect(zipBuffer).toBeDefined();
    expect(zipBuffer.length).toBeGreaterThan(0);
  });

  it('Row with very long name is automatically fitted and shrunk without overflowing', async () => {
    const csv =
      'runner_number,name\n' +
      '101,Johnathan Bartholomew Montgomery-Smith The Third Esq.\n';

    const { rows } = await processCsvMerge({
      csvString: csv,
      template,
      orderNo: 'DH-2026-000123',
      width_mm: 210,
      height_mm: 148,
    });

    expect(rows.length).toBe(1);
    const nameField = rows[0].fields.find((f) => f.key === 'name');
    expect(nameField).toBeDefined();
    expect(nameField?.fontSize).toBeLessThan(28); // Shrunk from 28
    expect(nameField?.fontSize).toBeGreaterThanOrEqual(12); // Above min
  });

  it('Missing required header throws 400 listing which header is missing', () => {
    const csv = 'number,name\n101,Alice\n'; // 'number' instead of 'runner_number'

    expect(() =>
      validateCsvData(csv, ['runner_number', 'name'])
    ).toThrowError(/Missing required header: runner_number/);
  });

  it('Empty required field on row 4 reports error explicitly mentioning "row 4"', () => {
    const csv =
      'runner_number,name\n' +
      '101,Alice\n' +
      '102,Bob\n' +
      '103,Charlie\n' +
      ',David\n'; // Row 4 (data row 4) has empty runner_number

    expect(() =>
      validateCsvData(csv, ['runner_number', 'name'])
    ).toThrowError(/row 4/i);
  });

  it('Unicode names, commas in quotes, and UTF-8 BOM are cleanly parsed', () => {
    // UTF-8 BOM: \uFEFF
    const csv =
      '\uFEFFrunner_number,name\n' +
      '101,"García, María"\n' +
      '102,Søren Kierkegaard\n';

    const rows = validateCsvData(csv, ['runner_number', 'name']);
    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe('García, María');
    expect(rows[1].name).toBe('Søren Kierkegaard');
  });

  it('Endpoint /api/orders/:id/csv rejects products where supports_csv_merge is false with 400', async () => {
    const res = await fetch(`${baseUrl}/api/orders/order-123/csv?product=custom-labels-stickers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({ csv_data: 'runner_number,name\n1,Test' }),
    });

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('CSV_MERGE_NOT_SUPPORTED');
  });

  it('Endpoint /api/orders/:id/csv succeeds on supported products (tyvek-race-numbers)', async () => {
    const res = await fetch(`${baseUrl}/api/orders/order-123/csv?product=tyvek-race-numbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-customer-token',
      },
      body: JSON.stringify({ csv_data: 'runner_number,name\n101,Runner One\n102,Runner Two' }),
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.files_generated).toBe(2);
    expect(json.data.zip_storage_path).toContain('csv_zip');
  });
});
