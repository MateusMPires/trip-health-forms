'use client';

import type { LucideIcon } from 'lucide-react';

// Section header shown at the top of each wizard step: icon chip, "SEÇÃO 0X / 0Y"
// eyebrow, title and description. Driven by the wizard, which knows the index/total.
export function SectionHeader({
  icon: Icon,
  index,
  total,
  title,
  description,
}: {
  icon: LucideIcon;
  index: number;
  total: number;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted text-foreground">
          <Icon className="size-5" aria-hidden strokeWidth={1.75} />
        </span>
        <span className="font-mono text-xs font-medium tracking-wider tabular-nums text-muted">
          SEÇÃO {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]">
          {title}
        </h2>
        {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
      </div>
    </div>
  );
}
