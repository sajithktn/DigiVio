export interface XeroInvoiceRow {
  ContactName: string;
  EmailAddress: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  DueDate: string;
  Description: string;
  Quantity: number;
  UnitAmount: number;
  AccountCode: string;
  TaxType: string;
  Currency: string;
}

export interface AccountingProvider {
  name: string;
  exportInvoices(from?: string, to?: string): Promise<string>;
  syncInvoice?(orderId: string): Promise<{ success: boolean; externalId?: string; message: string }>;
}
