import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Select({
  label,
  helperText,
  error,
  children,
  className = "",
  id,
  ...props
}: SelectProps) {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full rounded-btn border bg-surface-card px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-200 hover:border-lavender focus:border-primary focus:shadow-focus appearance-none pr-9 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-danger focus:border-danger focus:shadow-none" : "border-line"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-ink-muted">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-danger flex items-center gap-1 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-ink-muted">{helperText}</p>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export function Textarea({
  label,
  helperText,
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id || generatedId;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-ink">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded-btn border bg-surface-card p-3 text-sm text-ink outline-none transition-all duration-200 hover:border-lavender focus:border-primary focus:shadow-focus resize-y disabled:opacity-50 ${
          error ? "border-danger focus:border-danger" : "border-line"
        } ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs text-danger font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-ink-muted">{helperText}</p>}
    </div>
  );
}

export interface NumberStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 100000,
  step = 1,
  label,
  disabled = false,
}: NumberStepperProps) {
  const handleDecrement = () => {
    if (value - step >= min) onChange(value - step);
  };

  const handleIncrement = () => {
    if (value + step <= max) onChange(value + step);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      if (parsed < min) onChange(min);
      else if (parsed > max) onChange(max);
      else onChange(parsed);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <span className="block text-xs font-semibold uppercase tracking-wider text-ink">{label}</span>}
      <div className="inline-flex items-center rounded-btn border border-line bg-surface-card overflow-hidden shadow-soft">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label="Decrease quantity"
          className="h-10 w-10 flex items-center justify-center text-ink hover:bg-lavender-light active:bg-lavender transition disabled:opacity-30 disabled:cursor-not-allowed border-r border-line font-bold"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          min={min}
          max={max}
          className="h-10 w-20 text-center text-sm font-semibold tabular-nums text-ink bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label="Increase quantity"
          className="h-10 w-10 flex items-center justify-center text-ink hover:bg-lavender-light active:bg-lavender transition disabled:opacity-30 disabled:cursor-not-allowed border-l border-line font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}
