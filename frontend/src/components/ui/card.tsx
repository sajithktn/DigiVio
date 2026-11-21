import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverLift = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-surface-card rounded-card border border-line shadow-soft p-6 transition-all duration-200",
          hoverLift && "hover:shadow-card hover:-translate-y-1 hover:border-primary/30",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
