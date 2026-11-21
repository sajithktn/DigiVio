import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { OrderRecord } from '../orders/orders.service.js';

export const renderInvoicePdf = async (order: OrderRecord, invoiceNo: string): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Tax Invoice — ${invoiceNo}`);
  pdfDoc.setProducer('Digital Heroes Automated Billing');

  // Standard A4: 595 x 842 pt
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Header
  page.drawText('DIGITAL HEROES PRINT HOUSE', {
    x: 50,
    y: 780,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText('TAX INVOICE / RECEIPT', {
    x: 400,
    y: 780,
    size: 14,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Invoice No: ${invoiceNo}`, { x: 400, y: 760, size: 10, font: fontRegular });
  page.drawText(`Order No: ${order.order_no}`, { x: 400, y: 745, size: 10, font: fontRegular });
  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString()}`, { x: 400, y: 730, size: 10, font: fontRegular });
  page.drawText(`Status: ${order.payment_status.toUpperCase()}`, { x: 400, y: 715, size: 10, font: fontBold, color: rgb(0.1, 0.6, 0.2) });

  // Bill To
  page.drawText('Billed To:', { x: 50, y: 730, size: 11, font: fontBold });
  page.drawText(`Customer ID: ${order.user_id}`, { x: 50, y: 715, size: 10, font: fontRegular });

  // Table Header
  let y = 660;
  page.drawRectangle({
    x: 50,
    y: y - 5,
    width: 495,
    height: 25,
    color: rgb(0.95, 0.95, 0.95),
  });
  page.drawText('Item Description', { x: 60, y: y + 3, size: 10, font: fontBold });
  page.drawText('Qty', { x: 300, y: y + 3, size: 10, font: fontBold });
  page.drawText('Unit (INR)', { x: 370, y: y + 3, size: 10, font: fontBold });
  page.drawText('Total (INR)', { x: 470, y: y + 3, size: 10, font: fontBold });

  y -= 30;
  for (const item of order.items) {
    const unitRupees = (item.unit_price_minor / 100).toFixed(2);
    const lineRupees = (item.line_total_minor / 100).toFixed(2);

    page.drawText(`${item.product_name} (${item.config.width_mm}x${item.config.height_mm}mm)`, {
      x: 60,
      y,
      size: 9,
      font: fontRegular,
    });
    page.drawText(`${item.qty}`, { x: 305, y, size: 9, font: fontRegular });
    page.drawText(`INR ${unitRupees}`, { x: 370, y: y, size: 9, font: fontRegular });
    page.drawText(`INR ${lineRupees}`, { x: 470, y: y, size: 9, font: fontRegular });
    y -= 25;
  }

  // Financial Summary
  y -= 20;
  const subtotalRupees = (order.subtotal_minor / 100).toFixed(2);
  const gstRupees = (order.tax_minor / 100).toFixed(2);
  const totalRupees = (order.total_minor / 100).toFixed(2);

  page.drawLine({ start: { x: 300, y: y + 15 }, end: { x: 545, y: y + 15 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page.drawText('Subtotal (Incl. Tax):', { x: 320, y, size: 10, font: fontRegular });
  page.drawText(`INR ${subtotalRupees}`, { x: 470, y: y, size: 10, font: fontRegular });

  y -= 20;
  page.drawText('Included 18% GST:', { x: 320, y, size: 10, font: fontRegular });
  page.drawText(`INR ${gstRupees}`, { x: 470, y: y, size: 10, font: fontRegular });

  y -= 25;
  page.drawRectangle({ x: 300, y: y - 5, width: 245, height: 25, color: rgb(0.9, 0.95, 0.9) });
  page.drawText('TOTAL PAID:', { x: 320, y: y + 3, size: 11, font: fontBold });
  page.drawText(`INR ${totalRupees}`, { x: 470, y: y + 3, size: 11, font: fontBold, color: rgb(0, 0.5, 0.1) });

  return pdfDoc.save();
};
