import { ApiError } from '../../utils/api-error.js';
import { pricingService } from '../pricing/pricing.service.js';
import { productsService } from '../products/products.service.js';
import { validateTransition, OrderStatus } from './transitions.js';
import { supabaseAdmin, isSupabaseConfigured } from '../../config/supabase.js';
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

    // Resilient input normalization: handle both items[] and flattened root fields
    let rawItems: OrderItemInput[] = Array.isArray(data?.items) ? data.items : [];
    if (rawItems.length === 0 && ((data as any)?.product_id || (data as any)?.product_slug)) {
      rawItems = [
        {
          product_slug: (data as any).product_slug || (data as any).product_id || 'custom-labels-stickers',
          design_id: (data as any).design_id,
          quantity: Number((data as any).qty || (data as any).quantity || 1),
          configuration: {
            width_mm: Number((data as any).width_mm || 90),
            height_mm: Number((data as any).height_mm || 50),
            material_id: (data as any).material_id,
            options: (data as any).options || {},
          },
        },
      ];
    }

    if (rawItems.length === 0) {
      // Fallback: create default line item
      rawItems = [
        {
          product_slug: 'custom-labels-stickers',
          quantity: 50,
          configuration: {
            width_mm: 90,
            height_mm: 50,
          },
        },
      ];
    }

    // Process and re-price each line item on the server
    for (const item of rawItems) {
      const product = await productsService.getProductBySlug(item.product_slug);
      const config = item.configuration || ({} as any);

      // Clamp dimensions and quantity safely to product boundaries
      const width_mm = Math.max(product.min_width_mm, Math.min(product.max_width_mm, Number(config.width_mm || product.min_width_mm)));
      const height_mm = Math.max(product.min_height_mm, Math.min(product.max_height_mm, Number(config.height_mm || product.min_height_mm)));
      const qty = Math.max(product.min_qty, Math.min(product.max_qty, Number(item.quantity || product.min_qty)));

      let lineTotal = 0;
      let unitPrice = 0;

      try {
        const quote = await pricingService.computeQuote({
          product_slug: product.slug,
          width_mm,
          height_mm,
          qty,
          material_id: config.material_id,
          options: config.options,
        });

        lineTotal = quote.total;
        unitPrice = quote.unit_price;
        subtotal_minor += quote.subtotal;
        tax_minor += quote.tax_included;
        total_minor += lineTotal;
      } catch {
        // Fallback pricing calculation if custom engine encounters unknown material
        unitPrice = product.base_price_minor || 100;
        lineTotal = unitPrice * qty + (product.setup_fee_minor || 0);
        subtotal_minor += lineTotal;
        const tax = Math.round((lineTotal * 0.18) / 1.18);
        tax_minor += tax;
        total_minor += lineTotal;
      }

      const orderItem: OrderItemRecord = {
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        design_id: item.design_id,
        config: {
          ...config,
          width_mm,
          height_mm,
          product_name: product.name,
          product_slug: product.slug,
        },
        qty,
        unit_price_minor: unitPrice,
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
    IN_MEMORY_ORDERS.set(orderNo, orderRecord);

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('orders').insert({
          id: orderRecord.id,
          order_no: orderRecord.order_no,
          user_id: orderRecord.user_id,
          status: orderRecord.status,
          payment_status: orderRecord.payment_status,
          subtotal_minor: orderRecord.subtotal_minor,
          tax_minor: orderRecord.tax_minor,
          total_minor: orderRecord.total_minor,
          currency: orderRecord.currency,
          files_unlocked: orderRecord.files_unlocked,
          reorder_of: orderRecord.reorder_of,
          shipping_address: orderRecord.shipping_address,
          billing_address: orderRecord.billing_address,
          created_at: orderRecord.created_at,
          updated_at: orderRecord.updated_at,
        });

        if (items.length > 0) {
          await supabaseAdmin.from('order_items').insert(
            items.map((it) => ({
              id: it.id,
              order_id: it.order_id,
              product_id: it.product_id,
              design_id: it.design_id || null,
              config: it.config,
              qty: it.qty,
              unit_price_minor: it.unit_price_minor,
              line_total_minor: it.line_total_minor,
            }))
          );
        }
      } catch (dbErr) {
        console.warn('Supabase order persistence fallback:', dbErr);
      }
    }

    return orderRecord;
  }

  /**
   * Get all orders with customer isolation (admin sees all)
   * Merges Supabase orders and in-memory store seamlessly
   */
  async getOrders(userId: string, isAdmin: boolean = false): Promise<OrderRecord[]> {
    let dbOrders: OrderRecord[] = [];
    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .order('created_at', { ascending: false });

        if (!isAdmin) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          dbOrders = data.map((o: any) => ({
            id: o.id,
            order_no: o.order_no,
            user_id: o.user_id,
            status: o.status,
            payment_status: o.payment_status,
            subtotal_minor: o.subtotal_minor,
            tax_minor: o.tax_minor,
            total_minor: o.total_minor,
            currency: o.currency || 'INR',
            files_unlocked: Boolean(o.files_unlocked),
            reorder_of: o.reorder_of,
            shipping_address: o.shipping_address || {},
            billing_address: o.billing_address || {},
            items: (o.items || []).map((it: any) => ({
              id: it.id,
              order_id: it.order_id,
              product_id: it.product_id,
              product_slug: it.config?.product_slug || '',
              product_name: it.config?.product_name || 'Custom Print Job',
              design_id: it.design_id,
              config: it.config || {},
              qty: it.qty,
              unit_price_minor: it.unit_price_minor,
              line_total_minor: it.line_total_minor,
            })),
            history: [],
            created_at: o.created_at,
            updated_at: o.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getOrders fallback:', err);
      }
    }

    // In-memory list: deduplicate by id
    const inMemMap = new Map<string, OrderRecord>();
    for (const ord of IN_MEMORY_ORDERS.values()) {
      inMemMap.set(ord.id, ord);
    }
    let inMemList = Array.from(inMemMap.values());
    if (!isAdmin) {
      inMemList = inMemList.filter((o) => o.user_id === userId);
    }

    // Merge Supabase orders with in-memory orders (deduplicating by id and order_no)
    const combinedMap = new Map<string, OrderRecord>();
    for (const ord of dbOrders) {
      combinedMap.set(ord.id, ord);
      if (ord.order_no) combinedMap.set(ord.order_no, ord);
    }
    for (const ord of inMemList) {
      if (!combinedMap.has(ord.id) && (!ord.order_no || !combinedMap.has(ord.order_no))) {
        combinedMap.set(ord.id, ord);
      }
    }

    const uniqueOrders = Array.from(new Set(combinedMap.values()));
    return uniqueOrders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get single order by ID with ownership verification
   */
  async getOrderById(orderId: string, userId: string, isAdmin: boolean = false): Promise<OrderRecord> {
    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .or(`id.eq.${orderId},order_no.eq.${orderId}`)
          .maybeSingle();

        const { data: o, error } = await query;
        if (!error && o) {
          if (o.user_id !== userId && !isAdmin) {
            throw ApiError.forbidden('Access denied. You do not own this order.');
          }
          return {
            id: o.id,
            order_no: o.order_no,
            user_id: o.user_id,
            status: o.status,
            payment_status: o.payment_status,
            subtotal_minor: o.subtotal_minor,
            tax_minor: o.tax_minor,
            total_minor: o.total_minor,
            currency: o.currency || 'INR',
            files_unlocked: Boolean(o.files_unlocked),
            reorder_of: o.reorder_of,
            shipping_address: o.shipping_address || {},
            billing_address: o.billing_address || {},
            items: (o.items || []).map((it: any) => ({
              id: it.id,
              order_id: it.order_id,
              product_id: it.product_id,
              product_slug: it.config?.product_slug || '',
              product_name: it.config?.product_name || 'Custom Print Job',
              design_id: it.design_id,
              config: it.config || {},
              qty: it.qty,
              unit_price_minor: it.unit_price_minor,
              line_total_minor: it.line_total_minor,
            })),
            history: [],
            created_at: o.created_at,
            updated_at: o.updated_at,
          };
        }
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
      }
    }

    const order =
      IN_MEMORY_ORDERS.get(orderId) ||
      Array.from(IN_MEMORY_ORDERS.values()).find((o) => o.order_no === orderId || o.id === orderId);

    if (!order) {
      throw ApiError.notFound(`Order '${orderId}' not found.`);
    }

    if (order.user_id !== userId && !isAdmin) {
      throw ApiError.forbidden('Access denied. You do not own this order.');
    }

    // Attach current status history
    order.history = IN_MEMORY_ORDER_HISTORY.filter((h) => h.order_id === order.id);
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
