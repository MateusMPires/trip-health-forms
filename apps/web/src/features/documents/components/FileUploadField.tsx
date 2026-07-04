'use client';

import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { DocumentInput, DocumentKind } from '@viagem/core';
import { cn } from '@/lib/cn';
import { ALLOWED_MIME_TYPES } from '@/lib/config';
import { uploadTravelerFile, uploadErrorMessage } from '@/lib/upload';
import { useFormMeta } from '@/features/traveler-form/form-context';
import type { TravelerForm } from '@/features/traveler-form/hooks/useTravelerForm';

interface Pending {
  id: string;
  fileName: string;
  status: 'uploading' | 'error';
  error?: string;
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Reusable upload field bound to the form's documents[] array (filtered by kind). Handles
// client validation, compression + signed upload (via lib/upload), and per-file status.
export function FileUploadField({
  form,
  kind,
  label,
  hint,
  maxFiles = 1,
  required = false,
  error,
}: {
  form: TravelerForm;
  kind: DocumentKind;
  label: string;
  hint?: string;
  maxFiles?: number;
  required?: boolean;
  error?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const { code, travelerId } = useFormMeta();

  const documents = form.watch('documents') ?? [];
  const mine = documents.filter((d) => d.kind === kind);
  const accept = ALLOWED_MIME_TYPES[kind].join(',');
  const atLimit = mine.length + pending.filter((p) => p.status === 'uploading').length >= maxFiles;

  function setDocuments(next: DocumentInput[]) {
    form.setValue('documents', next, { shouldDirty: true });
    // Clear any stale "identity required" error once a file lands.
    form.clearErrors('documents');
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = maxFiles - mine.length - pending.filter((p) => p.status === 'uploading').length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));

    for (const file of chosen) {
      const id = crypto.randomUUID();
      setPending((prev) => [...prev, { id, fileName: file.name, status: 'uploading' }]);
      try {
        const doc = await uploadTravelerFile({ file, kind, code, travelerId });
        setDocuments([...(form.getValues('documents') ?? []), doc]);
        setPending((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: 'error', error: uploadErrorMessage(err) } : p,
          ),
        );
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeDoc(path: string) {
    setDocuments((form.getValues('documents') ?? []).filter((d) => d.storage_path !== path));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </span>
        {maxFiles > 1 && (
          <span className="text-xs text-muted">
            {mine.length}/{maxFiles}
          </span>
        )}
      </div>
      {hint && <p className="-mt-1 text-xs text-muted">{hint}</p>}

      {!atLimit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all',
            dragging
              ? 'border-primary bg-primary-soft'
              : 'border-border-strong bg-surface hover:border-primary hover:bg-primary-soft/40',
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-6 text-primary" aria-hidden>
            <path
              d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-semibold text-foreground">Adicionar arquivo</span>
          <span className="text-xs text-muted">Toque para escolher ou arraste aqui · máx. 10 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {mine.map((doc) => (
            <motion.li
              key={doc.storage_path}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <FileBadge ok />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
                <p className="text-xs text-muted">{formatSize(doc.size_bytes)} · enviado</p>
              </div>
              <button
                type="button"
                onClick={() => removeDoc(doc.storage_path)}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                aria-label="Remover arquivo"
              >
                <XIcon />
              </button>
            </motion.li>
          ))}
          {pending.map((p) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5',
                p.status === 'error' ? 'border-danger/50 bg-danger-soft' : 'border-border bg-surface',
              )}
            >
              <FileBadge ok={false} error={p.status === 'error'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{p.fileName}</p>
                <p className={cn('text-xs', p.status === 'error' ? 'text-danger' : 'text-muted')}>
                  {p.status === 'error' ? p.error : 'Enviando…'}
                </p>
              </div>
              {p.status === 'error' && (
                <button
                  type="button"
                  onClick={() => setPending((prev) => prev.filter((x) => x.id !== p.id))}
                  className="rounded-lg p-1.5 text-muted hover:text-danger"
                  aria-label="Descartar"
                >
                  <XIcon />
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function FileBadge({ ok, error = false }: { ok: boolean; error?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
        error ? 'bg-danger/10 text-danger' : ok ? 'bg-primary-soft text-primary' : 'bg-surface-muted text-muted',
      )}
      aria-hidden
    >
      {ok ? (
        <svg viewBox="0 0 20 20" fill="none" className="size-4">
          <path d="M4 10.5L8 14.5L16 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : error ? (
        <XIcon />
      ) : (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
    </span>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden>
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
