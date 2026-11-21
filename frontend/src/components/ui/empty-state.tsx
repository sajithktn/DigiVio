import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card border border-line bg-surface-card shadow-soft ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-lavender-light border border-line flex items-center justify-center text-primary mb-4 shadow-soft">
        {icon || <FolderOpen className="w-7 h-7 text-primary" />}
      </div>
      <h3 className="font-heading font-bold text-base text-plum">{title}</h3>
      <p className="text-xs text-ink-muted mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-btn bg-lavender-light/80 ${className}`}
    />
  );
}
