import React from "react";

export interface PriceTagProps {
  amountMinor: number; // in paise
  unit?: string;
  showTaxInclusive?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PriceTag({
  amountMinor,
  unit,
  showTaxInclusive = true,
  size = "md",
  className = "",
}: PriceTagProps) {
  const formatted = (amountMinor / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: "text-base font-bold",
    md: "text-xl font-bold",
    lg: "text-2xl sm:text-3xl font-extrabold",
    xl: "text-3xl sm:text-4xl font-extrabold",
  }[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="inline-flex items-baseline gap-1">
        <span className={`tabular-nums text-primary font-heading ${sizeClasses}`}>
          ₹{formatted}
        </span>
        {unit && <span className="text-xs text-ink-muted font-medium">/{unit}</span>}
      </div>
      {showTaxInclusive && (
        <span className="text-[10px] text-ink-muted leading-none">incl. 18% GST</span>
      )}
    </div>
  );
}
