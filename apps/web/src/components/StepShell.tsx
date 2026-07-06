'use client';

// Wraps a step's questions with consistent vertical rhythm. The section header
// (icon + title + description) is rendered by the Wizard from steps.config.
export function StepShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

// Groups a set of related questions under a light sub-heading inside a step.
export function FieldGroup({
  legend,
  number,
  children,
}: {
  legend?: string;
  number?: number;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      {legend && (
        <legend className="flex gap-2 text-sm font-semibold text-foreground">
          {number != null && (
            <span className="mt-px w-6 shrink-0 font-mono text-xs font-normal tabular-nums text-muted" aria-hidden>
              {String(number).padStart(2, '0')}
            </span>
          )}
          <span>{legend}</span>
        </legend>
      )}
      {children}
    </fieldset>
  );
}
