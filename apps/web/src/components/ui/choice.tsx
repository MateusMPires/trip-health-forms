'use client';

import { cn } from '@/lib/cn';

// A selectable option rendered as a card. Works for both single (radio) and multi (checkbox)
// selection — the parent owns the state and passes `selected` + `onToggle`.
export function OptionCard({
  selected,
  onToggle,
  label,
  multi = false,
  disabled = false,
}: {
  selected: boolean;
  onToggle: () => void;
  label: string;
  multi?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
        selected
          ? 'border-primary bg-primary-soft text-foreground'
          : 'border-border bg-surface text-foreground hover:border-border-strong',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center border transition-all',
          multi ? 'rounded-md' : 'rounded-full',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong',
        )}
        aria-hidden
      >
        {selected && (
          <svg viewBox="0 0 20 20" fill="none" className="size-3.5">
            <path
              d="M5 10.5L8.5 14L15 6.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Sim / Não segmented control. value is a tri-state: true, false, or null (unanswered).
export function YesNo({
  value,
  onChange,
  invalid = false,
  yesLabel = 'Sim',
  noLabel = 'Não',
}: {
  value: boolean | null | undefined;
  onChange: (value: boolean) => void;
  invalid?: boolean;
  yesLabel?: string;
  noLabel?: string;
}) {
  const options: Array<{ label: string; val: boolean }> = [
    { label: yesLabel, val: true },
    { label: noLabel, val: false },
  ];
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 rounded-2xl border p-1',
        invalid ? 'border-danger/50' : 'border-border',
      )}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = value === opt.val;
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.val)}
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
              active
                ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_rgba(18,179,196,0.8)]'
                : 'text-muted hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
