'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const BASE_FIELD =
  'w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/70 ' +
  'transition-all duration-150 outline-none ' +
  'focus:border-primary focus:ring-4 focus:ring-primary/15';

function stateBorder(invalid?: boolean): string {
  return invalid ? 'border-danger/60' : 'border-border hover:border-border-strong';
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
    <select
      ref={ref}
      aria-invalid={invalid}
      className={cn(BASE_FIELD, 'appearance-none pr-10', stateBorder(invalid), className)}
      {...props}
    >
      {children}
    </select>
  );
});
