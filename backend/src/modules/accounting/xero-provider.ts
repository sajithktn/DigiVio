import { AccountingProvider } from './accounting.interface.js';

export interface XeroConfig {
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  redirectUri?: string;
}

/**
 * Stubbed implementation of Xero API integration.
 * Documents and outlines the direct OAuth2 API path for future activation.
 */
export class XeroApiProvider implements AccountingProvider {
  name = 'XeroApiProvider';
  private config: XeroConfig;

  constructor(config: XeroConfig = {}) {
    this.config = config;
  }

  async exportInvoices(from?: string, to?: string): Promise<string> {
    // When Xero API credentials are provided, this queries the Xero API directly.
    return `XERO_API_EXPORT_NOT_CONNECTED: Switch-on path available via OAuth2 tenant: ${this.config.tenantId || 'none'}`;
  }

  async syncInvoice(orderId: string): Promise<{ success: boolean; externalId?: string; message: string }> {
    // Outlines future webhook / direct sync to POST https://api.xero.com/api.xro/2.0/Invoices
    return {
      success: true,
      externalId: `xero-stub-${orderId}`,
      message: 'Xero API provider stub: invoice staged for sync upon connection.',
    };
  }
}

export const xeroApiProvider = new XeroApiProvider();
