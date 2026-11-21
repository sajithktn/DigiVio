import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isSuccess?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      isSuccess,
      helperText,
      leftIcon,
      rightAction,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-ink"
          >
            {label}
            {props.required && <span className="text-primary ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-11 px-3.5 bg-surface-card text-ink placeholder:text-ink-muted/60 text-sm rounded-btn border border-line",
              "transition-all duration-200",
              "hover:border-lavender",
              "focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20",
              "disabled:bg-lavender-light/40 disabled:cursor-not-allowed disabled:text-ink-muted",
              leftIcon && "pl-10",
              (rightAction || error || isSuccess) && "pr-10",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              isSuccess && "border-success focus:border-success focus:ring-success/20",
              className
            )}
            {...props}
          />
          {rightAction ? (
            <div className="absolute right-3 flex items-center">
              {rightAction}
            </div>
          ) : error ? (
            <div className="absolute right-3 flex items-center pointer-events-none text-danger">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : isSuccess ? (
            <div className="absolute right-3 flex items-center pointer-events-none text-success">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : null}
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-ink-muted mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
