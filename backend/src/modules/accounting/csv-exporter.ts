import { AccountingProvider, XeroInvoiceRow } from './accounting.interface.js';
import { IN_MEMORY_ORDERS, OrderRecord } from '../orders/orders.service.js';
import { IN_MEMORY_USERS } from '../admin/admin.controller.js';
import Papa from 'papaparse';

export class CsvExporter implements AccountingProvider {
  name = 'CsvExporter';

  /**
   * Export paid orders to Xero-ready invoice CSV format
   */
  async exportInvoices(from?: string, to?: string): Promise<string> {
    let orders = Array.from(IN_MEMORY_ORDERS.values());

    // Filter strictly only paid orders (PRD Level 2 Rule)
    orders = orders.filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled');

    if (from) {
      const fromTime = new Date(from).getTime();
      orders = orders.filter((o) => new Date(o.created_at).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime();
      orders = orders.filter((o) => new Date(o.created_at).getTime() <= toTime);
    }

    const rows: XeroInvoiceRow[] = [];

    for (const order of orders) {
      const user = IN_MEMORY_USERS.get(order.user_id);
      const contactName = user?.full_name || 'Valued Customer';
      const emailAddress = user?.email || 'accounts@digitalheroes.print';
      const invoiceNumber = `INV-2026-${order.order_no.split('-')[2] || order.order_no}`;
      const invoiceDate = order.created_at.slice(0, 10);
      const dueDate = invoiceDate; // Paid in full at checkout

      let itemsTotalMinor = 0;

      for (const item of order.items) {
        itemsTotalMinor += item.line_total_minor;
        const unitAmountRupees = Number((item.line_total_minor / (item.qty * 100)).toFixed(2));

        rows.push({
          ContactName: contactName,
          EmailAddress: emailAddress,
          InvoiceNumber: invoiceNumber,
          InvoiceDate: invoiceDate,
          DueDate: dueDate,
          Description: `${item.product_name} - ${item.config.width_mm || 0}x${item.config.height_mm || 0}mm`,
          Quantity: item.qty,
          UnitAmount: unitAmountRupees,
          AccountCode: '200',
          TaxType: '18% GST on Income',
          Currency: order.currency || 'INR',
        });
      }

      // If there is an additional setup fee or adjustment reconciling to order total
      const remainingMinor = order.total_minor - itemsTotalMinor;
      if (remainingMinor > 0) {
        rows.push({
          ContactName: contactName,
          EmailAddress: emailAddress,
          InvoiceNumber: invoiceNumber,
          InvoiceDate: invoiceDate,
          DueDate: dueDate,
          Description: 'Print Setup & Calibration Fee',
          Quantity: 1,
          UnitAmount: Number((remainingMinor / 100).toFixed(2)),
          AccountCode: '200',
          TaxType: '18% GST on Income',
          Currency: order.currency || 'INR',
        });
      }
    }

    // Convert rows to CSV format matching exact column headers
    const csvContent = Papa.unparse(rows, {
      quotes: false,
      header: true,
      columns: [
        'ContactName',
        'EmailAddress',
        'InvoiceNumber',
        'InvoiceDate',
        'DueDate',
        'Description',
        'Quantity',
        'UnitAmount',
        'AccountCode',
        'TaxType',
        'Currency',
      ],
    });

    // Add UTF-8 BOM so Excel on Windows opens encoding cleanly
    return '\uFEFF' + csvContent;
  }
}

export const csvExporter = new CsvExporter();
