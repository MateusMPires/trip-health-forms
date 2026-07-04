'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getTripPublic } from '@/lib/trip';
import { isPreview } from '@/lib/preview';
import { Wizard } from './Wizard';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; tripName: string }
  | { kind: 'invalid' }
  | { kind: 'error' };

export function TravelerFormPage({ code }: { code: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    getTripPublic(code).then((result) => {
      if (!active) return;
      if (result.status === 'found') setState({ kind: 'ready', tripName: result.name });
      else if (result.status === 'not_found') setState({ kind: 'invalid' });
      else setState({ kind: 'error' });
    });
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      {isPreview() && (
        <p className="rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-center text-xs font-medium text-primary">
          Modo preview — nenhum dado é enviado ao servidor.
        </p>
      )}

      {state.kind === 'loading' && <CenteredNote>Validando o código da viagem…</CenteredNote>}

      {state.kind === 'invalid' && (
        <StatusCard
          title="Código inválido"
          message="Não encontramos uma viagem ativa para este código. Confira o link recebido pela equipe."
        />
      )}

      {state.kind === 'error' && (
        <StatusCard
          title="Algo deu errado"
          message="Não foi possível validar o código agora. Verifique sua conexão e tente novamente."
        />
      )}

      {state.kind === 'ready' && (
        <>
          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-3"
          >
            <span className="w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Ficha de saúde
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {state.tripName}
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Preencha os dados do viajante para garantir a segurança e o bem-estar durante a viagem.
              As informações são confidenciais e usadas apenas pela equipe e pela enfermeira do grupo.
              Preencha uma ficha para cada adolescente ou missionário.
            </p>
          </motion.header>

          <Wizard code={code} tripName={state.tripName} />
        </>
      )}
    </main>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center text-sm text-muted">
      <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {children}
    </div>
  );
}

function StatusCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-surface px-6 py-16 text-center shadow-[var(--shadow-card)]">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{message}</p>
    </div>
  );
}
