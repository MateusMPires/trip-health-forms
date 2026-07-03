# apps/web — Formulário web

Formulário público (Next.js, App Router) para cadastro do viajante. Acessível por link com o código
da viagem, sem necessidade de conta.

**Estrutura (feature-based):**
- `src/app/` — roteamento/layout. `(public)/viagem/[codigo]/` é o ponto de entrada do formulário.
- `src/features/` — `traveler-form` (multi-etapas), `documents` (upload), `health-info`, `consent`.
- `src/{components,lib,styles}/` — UI genérica, client Supabase/utils e estilos.

Domínio e validação vêm de `packages/core`; acesso a dados via `packages/supabase`.
