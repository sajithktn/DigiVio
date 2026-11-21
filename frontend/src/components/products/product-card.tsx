import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  division_slug: string;
  division_name?: string;
  description: string;
  base_price_minor: number;
  min_width_mm: number;
  max_width_mm: number;
  min_height_mm: number;
  max_height_mm: number;
  min_qty: number;
  image_url?: string;
  supports_csv_merge?: boolean;
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const fromPricePaise = product.base_price_minor || 29900;
  const formattedPrice = (fromPricePaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="group rounded-card bg-surface-card border border-line shadow-soft hover:shadow-lift hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Product Image Area on lavender-light (4:3 aspect) */}
      <div className="relative aspect-[4/3] bg-lavender-light overflow-hidden flex items-center justify-center p-6 border-b border-line">
        {/* Placeholder or visual representation with sneaker-store aesthetic */}
        <div className="w-full h-full rounded-btn bg-white/70 border border-line flex flex-col items-center justify-center p-4 text-center group-hover:scale-105 transition-transform duration-300 relative shadow-soft">
          <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-primary mb-2 shadow-soft">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <span className="font-heading font-extrabold text-sm text-plum line-clamp-1">
            {product.name}
          </span>
          <span className="text-[10px] text-ink-muted mt-1 uppercase tracking-wider font-semibold">
            {product.division_name || product.division_slug.replace(/-/g, " ")}
          </span>
        </div>

        {/* Feature Pill */}
        {product.supports_csv_merge && (
          <div className="absolute top-3 right-3">
            <Badge variant="primary" className="shadow-soft bg-white/90">
              CSV Merge
            </Badge>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {product.division_name || product.division_slug.replace(/-/g, " ")}
            </span>
            <span className="text-[11px] text-ink-muted">
              Min {product.min_qty || 50} units
            </span>
          </div>

          <h3 className="font-heading font-bold text-base text-plum group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-ink-muted leading-none">Starting from</div>
            <div className="text-lg font-heading font-extrabold text-primary tabular-nums mt-0.5">
              ₹{formattedPrice}
            </div>
            <div className="text-[10px] text-ink-muted leading-none">incl. 18% GST</div>
          </div>

          <Link href={`/products/${product.slug}`}>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Customize
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
