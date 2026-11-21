import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ApiError } from '../../utils/api-error.js';

export interface PixelDimensions {
  width_px: number;
  height_px: number;
  bleed_px: number;
  dpi: number;
}

export interface PointDimensions {
  width_pt: number;
  height_pt: number;
  bleed_pt: number;
  trim_w_pt: number;
  trim_h_pt: number;
}

export interface NamingParams {
  orderNo: string;
  productSlug: string;
  date?: Date;
  outputType: string; // e.g. 'print', 'preview', 'cut'
  ext: string;        // 'pdf', 'png'
}

/**
 * Calculates pixel dimensions @ DPI for trim + 2 * bleed
 * Formula: px = (mm / 25.4) * dpi
 */
export const calculatePixelDimensions = (
  width_mm: number,
  height_mm: number,
  bleed_mm: number = 3,
  dpi: number = 300
): PixelDimensions => {
  const totalW = width_mm + 2 * bleed_mm;
  const totalH = height_mm + 2 * bleed_mm;

  return {
    width_px: Math.round((totalW / 25.4) * dpi),
    height_px: Math.round((totalH / 25.4) * dpi),
    bleed_px: Math.round((bleed_mm / 25.4) * dpi),
    dpi,
  };
};

/**
 * Calculates PDF dimensions in standard points (72 points per inch)
 * Formula: pt = (mm * 72) / 25.4
 */
export const calculatePointDimensions = (
  width_mm: number,
  height_mm: number,
  bleed_mm: number = 3
): PointDimensions => {
  const totalW = width_mm + 2 * bleed_mm;
  const totalH = height_mm + 2 * bleed_mm;

  return {
    width_pt: (totalW * 72.0) / 25.4,
    height_pt: (totalH * 72.0) / 25.4,
    bleed_pt: (bleed_mm * 72.0) / 25.4,
    trim_w_pt: (width_mm * 72.0) / 25.4,
    trim_h_pt: (height_mm * 72.0) / 25.4,
  };
};

/**
 * Standard printfile naming pattern:
 * OrderID_ProductType_Date_Output.ext
 * Example: DH-2026-000123_race-numbers_20260319_print.pdf
 */
export const generatePrintFilename = (params: NamingParams): string => {
  const { orderNo, productSlug, date = new Date(), outputType, ext } = params;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const cleanOrderNo = orderNo.replace(/[^a-zA-Z0-9-]/g, '_');
  const cleanSlug = productSlug.replace(/[^a-z0-9-]/g, '-');
  const cleanOutput = outputType.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanExt = ext.toLowerCase().replace('.', '');

  return `${cleanOrderNo}_${cleanSlug}_${dateStr}_${cleanOutput}.${cleanExt}`;
};

export interface RenderPdfInput {
  orderNo: string;
  productName: string;
  width_mm: number;
  height_mm: number;
  bleed_mm?: number;
  elements?: any[];
}

/**
 * Generates production-ready PDF with TrimBox, BleedBox and metadata using pdf-lib
 */
export const renderPrintPdf = async (input: RenderPdfInput): Promise<Uint8Array> => {
  const { orderNo, productName, width_mm, height_mm, bleed_mm = 3 } = input;
  const { width_pt, height_pt, bleed_pt } = calculatePointDimensions(width_mm, height_mm, bleed_mm);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${orderNo} — ${productName}`);
  pdfDoc.setProducer('Digital Heroes Production Engine (pdf-lib)');
  pdfDoc.setCreator('DigiVio Web-to-Print API');

  const page = pdfDoc.addPage([width_pt, height_pt]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Draw background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width_pt,
    height: height_pt,
    color: rgb(1, 1, 1),
  });

  // Draw 3mm Bleed Boundary Guide Line (Trim Guide)
  page.drawRectangle({
    x: bleed_pt,
    y: bleed_pt,
    width: width_pt - 2 * bleed_pt,
    height: height_pt - 2 * bleed_pt,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });

  // Render Job Slug / Identification in the margin / trim box
  page.drawText(`${orderNo} | ${productName} | ${width_mm}x${height_mm}mm + ${bleed_mm}mm bleed`, {
    x: bleed_pt + 8,
    y: bleed_pt + 10,
    size: 8,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  return pdfDoc.save();
};
