import { ProofSummary } from './proofs.types.js';

export type OrderStatus =
  | 'quote'
  | 'order'
  | 'artwork'
  | 'proof'
  | 'production'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface ShippingAddress {
  recipient_name: string;
  company_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface OrderItemConfiguration {
  width_mm: number;
  height_mm: number;
  material_id: string;
  finish_id?: string;
  shape_id?: string;
  custom_addons?: string[];
  [key: string]: any;
}

export interface OrderItemCreateDTO {
  product_slug: string;
  configuration: OrderItemConfiguration;
  quantity: number;
  artwork_source: 'designer' | 'upload';
  artwork_url?: string;
  canvas_json?: Record<string, any>;
  has_variable_data?: boolean;
}

export interface CreateOrderDTO {
  items: OrderItemCreateDTO[];
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress;
  payment_reference?: string;
  notes?: string;
}

export interface OrderItemSummary {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  configuration: OrderItemConfiguration;
  quantity: number;
  unit_price: number;
  total_price: number;
  artwork_source: 'designer' | 'upload';
  artwork_url?: string;
  has_variable_data: boolean;
  proofs?: ProofSummary[];
  created_at: string;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  items_count?: number;
  items?: OrderItemSummary[];
  is_ready_for_production?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderFilterQuery {
  status?: OrderStatus;
  product_slug?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}
