'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: string;
  htmlFor?: string;
  /** When set, shows a small monospaced question number before the label. */
  number?: number;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

// The number sits in a fixed 1.5rem column + 0.5rem gap, so everything below the
// label (hint, input, error) can align to the label text via a matching pl-8.
const INDENT = 'pl-8';

// Label + optional number + hint + validation error wrapper shared by every input.
export function Field({
  label,
  htmlFor,
  number,
  required,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  const numbered = number != null;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="flex gap-2 text-sm font-medium text-foreground">
        {numbered && (
          <span className="mt-px w-6 shrink-0 font-mono text-xs tabular-nums text-muted" aria-hidden>
            {String(number).padStart(2, '0')}
          </span>
        )}
        <span>
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </span>
      </label>
      {hint && (
        <p className={cn('-mt-1 flex items-start gap-1.5 text-xs text-muted', numbered && INDENT)}>
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>{hint}</span>
        </p>
      )}
      <div className={cn(numbered && INDENT)}>{children}</div>
      {error && (
        <p className={cn('text-xs font-medium text-danger', numbered && INDENT)} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
