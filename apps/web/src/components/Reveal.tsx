'use client';

import { motion } from 'motion/react';

// Smooth height + fade reveal for conditional questions. Wrap in <AnimatePresence> at the callsite.
export function Reveal({ keyName, children }: { keyName: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={keyName}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  );
}
