import { IN_MEMORY_ORDERS, OrderRecord } from '../orders/orders.service.js';
import { IN_MEMORY_PRODUCTS, IN_MEMORY_DIVISIONS } from '../products/products.service.js';
import { IN_MEMORY_USERS } from './admin.controller.js';

export interface DailySeriesItem {
  date: string;
  order_count: number;
  revenue_minor: number;
}

export interface TopProductItem {
  slug: string;
  name: string;
  total_qty: number;
  revenue_minor: number;
}

export interface ReportsData {
  total_orders: number;
  revenue_minor: number;
  orders_by_status: Record<string, number>;
  throughput_by_division: Record<string, number>;
  top_products: TopProductItem[];
  daily_series: DailySeriesItem[];
}

export class ReportsService {
  /**
   * Calculate reports & analytics across orders for given date range
   */
  getReports(from?: string, to?: string): ReportsData {
    let orders = Array.from(IN_MEMORY_ORDERS.values());

    if (from) {
      const fromTime = new Date(from).getTime();
      orders = orders.filter((o) => new Date(o.created_at).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime();
      orders = orders.filter((o) => new Date(o.created_at).getTime() <= toTime);
    }

    const total_orders = orders.length;

    // Revenue strictly excludes unpaid, cancelled, and refunded orders
    const paidOrders = orders.filter(
      (o) => o.payment_status === 'paid' && o.status !== 'cancelled'
    );
    const revenue_minor = paidOrders.reduce((sum, o) => sum + o.total_minor, 0);

    // Orders by status
    const orders_by_status: Record<string, number> = {
      quote: 0,
      order: 0,
      artwork: 0,
      proof: 0,
      production: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      orders_by_status[o.status] = (orders_by_status[o.status] || 0) + 1;
    }

    // Throughput per division (sums exactly to total_orders)
    const productMap = new Map(IN_MEMORY_PRODUCTS.map((p) => [p.slug, p]));
    const throughput_by_division: Record<string, number> = {};
    for (const div of IN_MEMORY_DIVISIONS) {
      throughput_by_division[div.slug] = 0;
    }

    for (const o of orders) {
      const firstItemSlug = o.items[0]?.product_slug;
      const product = productMap.get(firstItemSlug);
      const divisionSlug = product?.division_slug || IN_MEMORY_DIVISIONS[0]?.slug || 'other';
      throughput_by_division[divisionSlug] = (throughput_by_division[divisionSlug] || 0) + 1;
    }

    // Top products
    const productAgg = new Map<string, { slug: string; name: string; total_qty: number; revenue_minor: number }>();
    for (const o of orders) {
      const isPaid = o.payment_status === 'paid' && o.status !== 'cancelled';
      for (const item of o.items) {
        let entry = productAgg.get(item.product_slug);
        if (!entry) {
          entry = {
            slug: item.product_slug,
            name: item.product_name,
            total_qty: 0,
            revenue_minor: 0,
          };
          productAgg.set(item.product_slug, entry);
        }
        entry.total_qty += item.qty;
        if (isPaid) {
          entry.revenue_minor += item.line_total_minor;
        }
      }
    }
    const top_products = Array.from(productAgg.values()).sort(
      (a, b) => b.revenue_minor - a.revenue_minor || b.total_qty - a.total_qty
    );

    // Daily series
    const dailyMap = new Map<string, { date: string; order_count: number; revenue_minor: number }>();
    for (const o of orders) {
      const dateKey = o.created_at.slice(0, 10);
      let dayEntry = dailyMap.get(dateKey);
      if (!dayEntry) {
        dayEntry = { date: dateKey, order_count: 0, revenue_minor: 0 };
        dailyMap.set(dateKey, dayEntry);
      }
      dayEntry.order_count += 1;
      if (o.payment_status === 'paid' && o.status !== 'cancelled') {
        dayEntry.revenue_minor += o.total_minor;
      }
    }
    const daily_series = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      total_orders,
      revenue_minor,
      orders_by_status,
      throughput_by_division,
      top_products,
      daily_series,
    };
  }

  /**
   * Archive search for completed orders (never deleted, immutable history)
   */
  getArchive(query?: string): any[] {
    let completed = Array.from(IN_MEMORY_ORDERS.values()).filter(
      (o) => o.status === 'completed'
    );

    if (query) {
      const q = query.toLowerCase();
      completed = completed.filter((o) => {
        const user = IN_MEMORY_USERS.get(o.user_id);
        const email = user?.email?.toLowerCase() || '';
        const name = user?.full_name?.toLowerCase() || '';
        const orderNo = o.order_no.toLowerCase();
        const itemMatch = o.items.some(
          (item) =>
            item.product_name.toLowerCase().includes(q) ||
            item.product_slug.toLowerCase().includes(q) ||
            JSON.stringify(item.config).toLowerCase().includes(q)
        );
        return orderNo.includes(q) || email.includes(q) || name.includes(q) || itemMatch;
      });
    }

    return completed.map((o) => {
      const user = IN_MEMORY_USERS.get(o.user_id);
      return {
        ...o,
        customer_email: user?.email || '',
        customer_name: user?.full_name || '',
        ready_for_production: o.files_unlocked && o.payment_status === 'paid',
      };
    });
  }
}

export const reportsService = new ReportsService();
