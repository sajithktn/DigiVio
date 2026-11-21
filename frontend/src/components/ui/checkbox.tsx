import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, checked, defaultChecked, onChange, ...props }, ref) => {
    const inputId = id || React.useId();
    const [isChecked, setIsChecked] = React.useState<boolean>(
      checked !== undefined ? checked : defaultChecked || false
    );

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setIsChecked(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <label
        htmlFor={inputId}
        className="inline-flex items-center gap-2.5 cursor-pointer select-none group"
      >
        <div className="relative flex items-center justify-center">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            checked={isChecked}
            onChange={handleChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              "w-5 h-5 rounded-[6px] border border-line bg-surface-card flex items-center justify-center transition-all duration-150",
              "group-hover:border-primary/60",
              "peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 peer-focus-visible:border-primary",
              isChecked ? "bg-primary border-primary text-white" : "text-transparent",
              className
            )}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
        {label && (
          <span className="text-sm text-ink-muted group-hover:text-ink transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
