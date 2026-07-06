'use client';

import { motion } from 'motion/react';

// Animated progress bar with a step counter. `current` is 1-based.
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <span className="text-xs font-medium text-muted">
          Etapa {current} de {total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        />
      </div>
    </div>
  );
}
