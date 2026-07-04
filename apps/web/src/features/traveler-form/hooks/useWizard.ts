'use client';

import { useCallback, useState } from 'react';
import type { StepDef } from '../steps/steps.config';
import type { TravelerForm } from './useTravelerForm';

function scrollToTop() {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Drives the step index and the per-step advance guard: schema fields via form.trigger()
// (inline errors) plus the step's custom validate() (banner message).
export function useWizard(form: TravelerForm, steps: StepDef[]) {
  const [index, setIndex] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const step = steps[index]!;
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = useCallback(async (): Promise<boolean> => {
    setChecking(true);
    const fieldsOk = step.fields.length > 0 ? await form.trigger(step.fields) : true;
    const message = step.validate ? step.validate(form) : null;
    setChecking(false);

    if (fieldsOk && !message) {
      setBanner(null);
      setIndex((i) => Math.min(i + 1, steps.length - 1));
      scrollToTop();
      return true;
    }
    setBanner(message);
    return false;
  }, [form, step, steps.length]);

  const prev = useCallback(() => {
    setBanner(null);
    setIndex((i) => Math.max(0, i - 1));
    scrollToTop();
  }, []);

  return { index, step, isFirst, isLast, banner, checking, next, prev, total: steps.length };
}
