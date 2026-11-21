import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "error" | "success" | "info";
  title?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    const config = {
      error: {
        container: "bg-red-50/80 border-l-4 border-danger text-ink",
        icon: <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />,
        titleColor: "text-danger font-semibold",
      },
      success: {
        container: "bg-green-50/80 border-l-4 border-success text-ink",
        icon: <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />,
        titleColor: "text-success font-semibold",
      },
      info: {
        container: "bg-lavender-light border-l-4 border-primary text-ink",
        icon: <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />,
        titleColor: "text-primary font-semibold",
      },
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 p-4 rounded-btn text-sm transition-all",
          config.container,
          className
        )}
        {...props}
      >
        {config.icon}
        <div className="flex-1 space-y-0.5">
          {title && <h5 className={config.titleColor}>{title}</h5>}
          <div className="text-ink/90 text-xs sm:text-sm">{children}</div>
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";
