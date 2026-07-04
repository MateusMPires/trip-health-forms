'use client';

// Section header shown at the top of each step: title + optional description.
export function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}

// Groups a set of related questions under a light sub-heading inside a step.
export function FieldGroup({
  legend,
  children,
}: {
  legend?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      {legend && (
        <legend className="text-sm font-semibold text-foreground">{legend}</legend>
      )}
      {children}
    </fieldset>
  );
}
