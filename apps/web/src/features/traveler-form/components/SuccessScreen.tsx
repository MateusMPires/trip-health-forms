'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';

export function SuccessScreen({ tripName }: { tripName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-[var(--shadow-card)]"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
        className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <Check className="size-8" aria-hidden strokeWidth={2.5} />
      </motion.span>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Ficha enviada!</h2>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Recebemos os dados para a <strong className="text-foreground">{tripName}</strong>. As
          informações serão tratadas com confidencialidade pela equipe responsável. Você já pode
          fechar esta página.
        </p>
      </div>
    </motion.div>
  );
}
