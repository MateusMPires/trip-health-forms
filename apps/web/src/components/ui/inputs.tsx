'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const BASE_FIELD =
  'w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/70 ' +
  'transition-all duration-150 outline-none ' +
  'focus:border-accent focus:ring-4 focus:ring-accent/15';

function stateBorder(invalid?: boolean): string {
  return invalid ? 'border-danger/60' : 'border-border hover:border-accent';
}

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextInput({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid}
      className={cn(BASE_FIELD, stateBorder(invalid), className)}
      {...props}
    />
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid}
      rows={3}
      className={cn(BASE_FIELD, 'resize-y', stateBorder(invalid), className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid}
        className={cn(BASE_FIELD, 'cursor-pointer appearance-none pr-10', stateBorder(invalid), className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
});
