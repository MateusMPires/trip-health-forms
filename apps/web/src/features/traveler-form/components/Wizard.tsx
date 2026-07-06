'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { SectionHeader } from '@/components/SectionHeader';
import { FormMetaProvider } from '../form-context';
import { useTravelerForm } from '../hooks/useTravelerForm';
import { useWizard } from '../hooks/useWizard';
import { useSubmitTraveler } from '../hooks/useSubmitTraveler';
import { STEPS } from '../steps/steps.config';
import { SuccessScreen } from './SuccessScreen';

export function Wizard({ code, tripName }: { code: string; tripName: string }) {
  const { form, travelerId } = useTravelerForm();
  const wizard = useWizard(form, STEPS);
  const { status, errorMessage, submit } = useSubmitTraveler(form, code);
  const reduceMotion = useReducedMotion();

  if (status === 'success') return <SuccessScreen tripName={tripName} />;

  const StepComponent = wizard.step.Component;
  const offset = reduceMotion ? 0 : 16;
  const busy = wizard.checking || status === 'submitting';

  async function handlePrimary() {
    if (wizard.isLast) {
      await submit();
    } else {
      await wizard.next();
    }
  }

  return (
    <FormMetaProvider value={{ code, travelerId }}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={wizard.step.id}
              initial={{ opacity: 0, x: offset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -offset }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <SectionHeader
                icon={wizard.step.icon}
                index={wizard.index + 1}
                total={wizard.total}
                title={wizard.step.title}
                description={wizard.step.description}
              />
              <div className="h-px bg-border" />
              <StepComponent form={form} />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {(wizard.banner || errorMessage) && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{wizard.banner ?? errorMessage}</span>
            </motion.p>
          )}
        </AnimatePresence>

        <ProgressBar current={wizard.index + 1} total={wizard.total} />

        <div className="flex items-center justify-between gap-3">
          {!wizard.isFirst ? (
            <Button type="button" variant="secondary" onClick={wizard.prev} disabled={busy}>
              <ChevronLeft className="size-4" aria-hidden />
              Anterior
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={handlePrimary} loading={busy}>
            {wizard.isLast ? 'Enviar ficha' : 'Seguinte'}
            {!busy &&
              (wizard.isLast ? (
                <Send className="size-4" aria-hidden />
              ) : (
                <ChevronRight className="size-4" aria-hidden />
              ))}
          </Button>
        </div>
      </form>
    </FormMetaProvider>
  );
}
