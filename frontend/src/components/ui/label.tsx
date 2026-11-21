import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, requiredIndicator, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-xs font-semibold text-ink uppercase tracking-wider select-none",
          className
        )}
        {...props}
      >
        {children}
        {requiredIndicator && <span className="text-danger ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";
