import Papa from 'papaparse';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');
import { ApiError } from '../../utils/api-error.js';
import { fitText } from './fit.js';
import { renderPrintPdf } from './render.js';
import { PassThrough } from 'stream';

export interface CsvMergeInput {
  csvString: string;
  template: {
    id?: string;
    placeholders: Array<{
      key: string;
      boxW: number;
      boxH: number;
      startSize?: number;
      minSize?: number;
      maxSize?: number;
      tracking?: number;
      minTracking?: number;
      shrink?: boolean;
    }>;
  };
  orderNo: string;
  width_mm: number;
  height_mm: number;
  bleed_mm?: number;
}

export interface MergedRowOutput {
  rowIndex: number;
  filename: string;
  fields: Array<{
    key: string;
    value: string;
    fontSize: number;
    tracking: number;
    overflow: boolean;
  }>;
  pdfBuffer: Uint8Array;
}

/**
 * Validates CSV string, headers, empty cells, and maximum rows
 */
export const validateCsvData = (
  csvString: string,
  requiredHeaders: string[],
  maxRows: number = 5000
): Record<string, string>[] => {
  // Strip BOM if present
  let cleanCsv = csvString;
  if (cleanCsv.charCodeAt(0) === 0xfeff) {
    cleanCsv = cleanCsv.slice(1);
  }

  const parsed = Papa.parse<Record<string, string>>(cleanCsv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    const firstErr = parsed.errors[0];
    throw ApiError.badRequest(`CSV parse error on line ${firstErr.row ?? 'header'}: ${firstErr.message}`);
  }

  const headers = parsed.meta.fields || [];
  for (const reqHeader of requiredHeaders) {
    if (!headers.includes(reqHeader)) {
      throw ApiError.badRequest(`Missing required header: ${reqHeader}`);
    }
  }

  if (parsed.data.length > maxRows) {
    throw ApiError.badRequest(`CSV row count (${parsed.data.length}) exceeds maximum allowed of ${maxRows} rows.`);
  }

  // Row validation for empty required values
  parsed.data.forEach((row, idx) => {
    const rowNum = idx + 1; // 1-indexed data row
    for (const reqHeader of requiredHeaders) {
      const val = row[reqHeader];
      if (val === undefined || val === null || String(val).trim() === '') {
        throw ApiError.badRequest(`Empty required value for "${reqHeader}" on row ${rowNum}.`);
      }
    }
  });

  return parsed.data;
};

/**
 * Merges CSV variable-data, fits text for each placeholder, generates individual PDFs, and zips them
 */
export const processCsvMerge = async (
  input: CsvMergeInput
): Promise<{ rows: MergedRowOutput[]; zipBuffer: Buffer }> => {
  const { csvString, template, orderNo, width_mm, height_mm, bleed_mm = 3 } = input;

  const requiredHeaders = template.placeholders.map((p) => p.key);
  const dataRows = validateCsvData(csvString, requiredHeaders);

  const rows: MergedRowOutput[] = [];

  // Process rows in batches of 25 to respect execution limits
  const BATCH_SIZE = 25;
  for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
    const batch = dataRows.slice(i, i + BATCH_SIZE);

    for (let j = 0; j < batch.length; j++) {
      const globalIdx = i + j;
      const dataRow = batch[j];
      const rowNumStr = String(globalIdx + 1).padStart(4, '0');
      const filename = `${orderNo}_row${rowNumStr}.pdf`;

      const fields: MergedRowOutput['fields'] = [];

      for (const placeholder of template.placeholders) {
        const textVal = String(dataRow[placeholder.key] || '');
        const fitResult = fitText({
          text: textVal,
          boxW: placeholder.boxW,
          boxH: placeholder.boxH,
          startSize: placeholder.startSize,
          minSize: placeholder.minSize,
          maxSize: placeholder.maxSize,
          tracking: placeholder.tracking,
          minTracking: placeholder.minTracking,
          shrink: placeholder.shrink ?? true,
        });

        fields.push({
          key: placeholder.key,
          value: textVal,
          fontSize: fitResult.fontSize,
          tracking: fitResult.tracking,
          overflow: fitResult.overflow,
        });
      }

      // Render individual row PDF
      const pdfBuffer = await renderPrintPdf({
        orderNo: `${orderNo}-ROW-${rowNumStr}`,
        productName: `Row ${rowNumStr}`,
        width_mm,
        height_mm,
        bleed_mm,
      });

      rows.push({
        rowIndex: globalIdx + 1,
        filename,
        fields,
        pdfBuffer,
      });
    }
  }

  // Create Zip buffer using ZipArchive
  const archive = new ZipArchive({ zlib: { level: 6 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err: any) => reject(err));
  });

  archive.pipe(stream);

  for (const row of rows) {
    archive.append(Buffer.from(row.pdfBuffer), { name: row.filename });
  }

  await archive.finalize();
  const zipBuffer = await zipPromise;

  return { rows, zipBuffer };
};
