import React from "react";
import { Check } from "lucide-react";

export const ORDER_STAGES = [
  { key: "quote", label: "Quote" },
  { key: "order", label: "Order" },
  { key: "artwork", label: "Artwork" },
  { key: "proof", label: "Proof" },
  { key: "production", label: "Production" },
  { key: "completed", label: "Completed" },
] as const;

export type OrderStageKey = typeof ORDER_STAGES[number]["key"];

export interface ProgressTrackerProps {
  currentStage: string;
  isCancelled?: boolean;
}

export function ProgressTracker({ currentStage, isCancelled = false }: ProgressTrackerProps) {
  const currentIndex = ORDER_STAGES.findIndex((s) => s.key === currentStage.toLowerCase());

  if (isCancelled) {
    return (
      <div className="w-full p-4 rounded-btn bg-danger/10 border border-danger/20 text-center text-sm font-semibold text-danger">
        Order Cancelled
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-line -z-0" />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-0"
          style={{
            width: `${Math.max(0, (Math.min(currentIndex, ORDER_STAGES.length - 1) / (ORDER_STAGES.length - 1)) * 100)}%`,
          }}
        />

        {ORDER_STAGES.map((stage, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isDone
                    ? "bg-primary text-white shadow-soft"
                    : isCurrent
                    ? "bg-primary text-white ring-4 ring-violet/30 shadow-card animate-pulse"
                    : "bg-surface-card border-2 border-line text-ink-muted"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-xs mt-2 font-medium tracking-tight whitespace-nowrap ${
                  isCurrent ? "text-primary font-bold" : isDone ? "text-ink" : "text-ink-muted"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Stacked Stepper */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Current Status:</span>
          <span className="font-bold text-primary uppercase tracking-wider">{currentStage}</span>
        </div>
        <div className="w-full h-2 rounded-pill bg-line overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${Math.max(10, ((currentIndex + 1) / ORDER_STAGES.length) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
