import { ApiError } from '../../utils/api-error.js';
import { pricingService } from '../pricing/pricing.service.js';
import { productsService } from '../products/products.service.js';
import { validateTransition, OrderStatus } from './transitions.js';
import crypto from 'crypto';

export interface OrderItemInput {
  product_slug: string;
  design_id?: string;
  configuration: {
    width_mm: number;
    height_mm: number;
    material_id?: string;
    options?: Record<string, any>;
    finish_id?: string;
    shape_id?: string;
    custom_addons?: string[];
  };
  quantity: number;
  // Intentionally ignoring client-sent unit_price / total_price
  client_tampered_price?: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  shipping_address?: Record<string, any>;
  billing_address?: Record<string, any>;
  reorder_of?: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  design_id?: string;
  config: Record<string, any>;
  qty: number;
  unit_price_minor: number;
  line_total_minor: number;
}

export interface StatusHistoryRecord {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string;
  note?: string;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  order_no: string;
  user_id: string;
  status: OrderStatus;
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
  subtotal_minor: number;
  tax_minor: number;
  total_minor: number;
  currency: string;
  files_unlocked: boolean;
  reorder_of?: string;
  shipping_address: Record<string, any>;
  billing_address: Record<string, any>;
  items: OrderItemRecord[];
  history: StatusHistoryRecord[];
  created_at: string;
  updated_at: string;
}

export const IN_MEMORY_ORDERS = new Map<string, OrderRecord>();
export const IN_MEMORY_ORDER_HISTORY: StatusHistoryRecord[] = [];

let orderCounter = 1;
const getNextOrderNo = (): string => {
  const currentYear = new Date().getFullYear();
  const seqStr = String(orderCounter++).padStart(6, '0');
  return `DH-${currentYear}-${seqStr}`;
};

export class OrdersService {
  /**
   * Create new order with server-computed prices and frozen configuration snapshot
   */
  async createOrder(userId: string, data: CreateOrderInput): Promise<OrderRecord> {
    const timestamp = new Date().toISOString();
    const orderId = crypto.randomUUID();
    const orderNo = getNextOrderNo();

    let subtotal_minor = 0;
    let tax_minor = 0;
    let total_minor = 0;

    const items: OrderItemRecord[] = [];

    // Process and re-price each line item on the server
    for (const item of data.items) {
      const product = await productsService.getProductBySlug(item.product_slug);

      // Recompute price with pure pricing engine — client price is completely ignored
      const quote = await pricingService.computeQuote({
        product_slug: item.product_slug,
        width_mm: item.configuration.width_mm,
        height_mm: item.configuration.height_mm,
        qty: item.quantity,
        material_id: item.configuration.material_id,
        options: item.configuration.options,
      });

      const lineTotal = quote.total;
      subtotal_minor += quote.subtotal;
      tax_minor += quote.tax_included;
      total_minor += lineTotal;

      const orderItem: OrderItemRecord = {
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        design_id: item.design_id,
        config: { ...item.configuration }, // Frozen snapshot
        qty: item.quantity,
        unit_price_minor: quote.unit_price,
        line_total_minor: lineTotal,
      };

      items.push(orderItem);
    }

    const initialHistory: StatusHistoryRecord = {
      id: crypto.randomUUID(),
      order_id: orderId,
      from_status: null,
      to_status: 'order',
      changed_by: userId,
      note: 'Initial order placement',
      created_at: timestamp,
    };

    IN_MEMORY_ORDER_HISTORY.push(initialHistory);

    const orderRecord: OrderRecord = {
      id: orderId,
      order_no: orderNo,
      user_id: userId,
      status: 'order',
      payment_status: 'unpaid',
      subtotal_minor,
      tax_minor,
      total_minor,
      currency: 'INR',
      files_unlocked: false,
      reorder_of: data.reorder_of,
      shipping_address: data.shipping_address || {},
      billing_address: data.billing_address || data.shipping_address || {},
      items,
      history: [initialHistory],
      created_at: timestamp,
      updated_at: timestamp,
    };

    IN_MEMORY_ORDERS.set(orderId, orderRecord);
    return orderRecord;
  }

  /**
   * Get all orders with customer isolation (admin sees all)
   */
  async getOrders(userId: string, isAdmin: boolean = false): Promise<OrderRecord[]> {
    const list = Array.from(IN_MEMORY_ORDERS.values());
    if (isAdmin) {
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list
      .filter((o) => o.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get single order by ID with ownership verification
   */
  async getOrderById(orderId: string, userId: string, isAdmin: boolean = false): Promise<OrderRecord> {
    const order = IN_MEMORY_ORDERS.get(orderId);
    if (!order) {
      throw ApiError.notFound(`Order '${orderId}' not found.`);
    }

    if (order.user_id !== userId && !isAdmin) {
      throw ApiError.forbidden('Access denied. You do not own this order.');
    }

    // Attach current status history
    order.history = IN_MEMORY_ORDER_HISTORY.filter((h) => h.order_id === orderId);
    return order;
  }

  /**
   * Transition order pipeline status with validation checks
   */
  async updateStatus(
    orderId: string,
    toStatus: OrderStatus,
    changedByUserId: string,
    note?: string
  ): Promise<OrderRecord> {
    const order = IN_MEMORY_ORDERS.get(orderId);
    if (!order) {
      throw ApiError.notFound(`Order '${orderId}' not found.`);
    }

    // Validate state transition
    validateTransition({
      fromStatus: order.status,
      toStatus,
      filesUnlocked: order.files_unlocked,
      paymentStatus: order.payment_status,
    });

    const timestamp = new Date().toISOString();
    const historyEntry: StatusHistoryRecord = {
      id: crypto.randomUUID(),
      order_id: orderId,
      from_status: order.status,
      to_status: toStatus,
      changed_by: changedByUserId,
      note: note || `Pipeline transition to ${toStatus}`,
      created_at: timestamp,
    };

    IN_MEMORY_ORDER_HISTORY.push(historyEntry);

    order.status = toStatus;
    order.updated_at = timestamp;
    order.history.push(historyEntry);
    IN_MEMORY_ORDERS.set(orderId, order);

    return order;
  }

  /**
   * One-click Reorder: clones items with current pricing, sets reorder_of
   */
  async reorder(pastOrderId: string, userId: string): Promise<OrderRecord> {
    const pastOrder = await this.getOrderById(pastOrderId, userId);

    // Hardening check: verify that each product and material is still active!
    for (const item of pastOrder.items) {
      let product;
      try {
        product = await productsService.getProductBySlug(item.product_slug);
      } catch {
        throw new ApiError(
          409,
          `Cannot reorder: product '${item.product_name || item.product_slug}' no longer exists in catalogue.`,
          'CONFLICT'
        );
      }

      if (!product.is_active) {
        throw new ApiError(
          409,
          `Cannot reorder: product '${product.name}' is inactive or discontinued. Please select an active alternative.`,
          'CONFLICT'
        );
      }

      const materialId = item.config?.material_id;
      if (materialId) {
        const material = product.materials.find((m) => m.id === materialId || m.name === materialId);
        if (material && !material.is_active) {
          throw new ApiError(
            409,
            `Cannot reorder: material '${material.name}' is discontinued and no longer available.`,
            'CONFLICT'
          );
        }
      }
    }

    const itemsToReorder: OrderItemInput[] = pastOrder.items.map((i) => ({
      product_slug: i.product_slug,
      design_id: i.design_id,
      configuration: i.config as any,
      quantity: i.qty,
    }));

    return this.createOrder(userId, {
      items: itemsToReorder,
      shipping_address: pastOrder.shipping_address,
      billing_address: pastOrder.billing_address,
      reorder_of: pastOrder.id,
    });
  }
}

export const ordersService = new OrdersService();
