import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "quote"
  | "order"
  | "artwork"
  | "proof"
  | "production"
  | "completed"
  | "cancelled"
  | "success"
  | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = "default",
  icon,
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-lavender text-deep border-line",
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-lavender-light text-ink border-line",
    // Emerald palette order statuses
    quote: "bg-lavender text-deep border-line",
    order: "bg-primary/10 text-primary border-primary/25",
    artwork: "bg-lavender-light text-primary border-primary/20",
    proof: "bg-secondary/20 text-deep border-secondary/30",
    production: "bg-deep text-white border-deep",
    completed: "bg-success/15 text-success border-success/30 font-semibold",
    cancelled: "bg-danger/15 text-danger border-danger/30 font-semibold",
    success: "bg-success/15 text-success border-success/30",
    danger: "bg-danger/15 text-danger border-danger/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-medium border tracking-wide transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase().replace(/\s+/g, "_");
  const variantMap: Record<string, BadgeVariant> = {
    quote: "quote",
    order: "order",
    artwork: "artwork",
    proof: "proof",
    production: "production",
    completed: "completed",
    cancelled: "cancelled",
    pending: "quote",
    approved: "completed",
    changes_requested: "danger",
    superseded: "secondary",
    paid: "completed",
    unpaid: "quote",
    failed: "danger",
  };

  const variant = variantMap[normalized] || "default";
  const label = status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown";

  return <Badge variant={variant}>{label}</Badge>;
}
