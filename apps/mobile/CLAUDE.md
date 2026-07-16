# CLAUDE.md — App dos líderes (`apps/mobile`)

> Regras específicas do app mobile. **Complementam** o `CLAUDE.md` da raiz — não o repetem nem o
> contradizem. Em conflito, vale a raiz. (Specs dizem o quê; isto diz como me comportar aqui.)

## O que é este app
App React Native (Expo + expo-router) para os **líderes** consultarem os viajantes de suas viagens —
dados pessoais, saúde e documentos — **online e offline**. O líder faz **login** (email + senha,
Supabase Auth) e se vincula às viagens por código. O SQLite local **espelha** o Supabase.

É **read-mostly**: o app basicamente lê. A sincronização é **pull-based, server-wins** — o servidor
é sempre a fonte da verdade; o app nunca sobrescreve o servidor.

**MVP desta fase:** login → lista de viagens → lista de viajantes → detalhe do viajante (dados +
saúde) → offline básico. Documentos entram no cache offline; busca/export/indicadores ficam para
depois. Começar pequeno e ver funcionar antes de generalizar.

## Stack (específica do mobile)
- **Expo** (managed) + **EAS**, React Native, **expo-router**.
- **`expo-sqlite` com SQLCipher** — banco local **cifrado** em repouso.
- **`expo-secure-store`** — Keychain (iOS) / Keystore (Android) para a chave do banco e a sessão.
- **`@supabase/supabase-js`** com sessão persistida em armazenamento seguro (login persiste e
  auto-renova — diferente do formulário web público, que é anônimo e não persiste).
- **`@viagem/core`** — Zod, enums e regras de domínio. **`@viagem/supabase`** — type `Database`.
- **Distribuição:** EAS Build → TestFlight (iOS) e Firebase App Distribution (Android).

## Regras invioláveis do mobile
> Além de todas as regras invioláveis da raiz (banco em inglês, RLS ligada, multi-tenant,
> consentimento obrigatório, migrations versionadas…).

- **Contrato de domínio compartilhado.** Validação, enums e regras (`isMinor`, consentimentos
  obrigatórios, tipos do viajante) vêm **sempre** de `@viagem/core`. Tipos das tabelas vêm de
  `@viagem/supabase` (`createClient<Database>`). **Nunca** redefinir schema/enum/regra dentro do app.
- **Read-mostly com uma exceção de write-back.** O app **não escreve** dados de viajante/saúde.
  Escritas permitidas, e só estas: (1) a RPC `join_trip` (líder se vincula a uma viagem por
  código); (2) **admin** da viagem **adicionar documentos** (Termo de Compromisso p/ todos;
  Autorização de Viagem Nacional p/ menores de 16 — regra de `@viagem/core`). **Nunca** usar
  `submit_traveler` — isso é do formulário público.
  - **Adicionar documento é offline-first.** Grava a linha otimista no SQLite (coluna local
    `pending_upload`) + copia a foto pro sandbox; aparece na hora, sem rede. O motor de sync
    (`pushPendingDocuments`, no início do `runSync`) faz o **write-back**: sobe o binário
    (`upsert:true`) e insere a linha em `documents` (id gerado no cliente → idempotente). O pull
    seguinte reconcilia por id; **server-wins** continua valendo pra todo o resto. A RLS
    (`is_trip_admin`) é a fronteira real — o gating de admin na UI é só UX (lê `trip_members.role`
    espelhado).
- **Segredos só no `.env`.** Apenas `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (anon key). **Jamais** a `SUPABASE_SERVICE_ROLE_KEY` no app. Nada de URL/chave/token hardcoded.
- **Dado sensível offline é cifrado.** O banco local usa **SQLCipher**; a chave vive no
  Keychain/Keystore (`expo-secure-store`), nunca no código nem em texto plano. Documentos cacheados
  ficam no sandbox do app.
- **Nunca logar dado sensível.** Proibido logar, printar ou enviar a analytics/crash reports
  (inclui breadcrumbs/Sentry) dados de saúde, documentos e dados pessoais de menores.
- **RLS é a fronteira real.** O app confia na RLS do Supabase e lê apenas o que `is_trip_member`
  libera. O app **não reimplementa** autorização — só consome o que a RLS permite.
- **`is_minor` é computado, nunca lido do banco.** Usar `isMinor(birthDate, reference)` de
  `@viagem/core` com data de referência explícita. Idem para obrigatoriedade de consentimentos.
- **Parâmetros só em `src/lib/config.ts`.** Nome do DB local, estratégia/limites de sync, page size,
  política de cache de documentos, etc. Constantes de domínio são importadas de `@viagem/core`,
  nunca redefinidas.

## Arquitetura offline (o coração do app)
- **Fonte da verdade = Supabase. SQLite = espelho local read-only.** Fluxo:
  1. Login (Supabase Auth) →
  2. `join_trip(code)` (onboarding — a única escrita) →
  3. `select`s RLS-scoped: `trips` → `travelers` → `guardians` → `health_records` → `consents` →
     `documents` →
  4. grava/atualiza o espelho no SQLite.
- **Cursor de sync incremental.** Usar `updated_at` como cursor e respeitar `deleted_at`
  (soft-delete) das tabelas. **Server-wins:** conflito nunca sobrescreve o servidor; o local é
  descartável e reconstruível.
- **Quando sincroniza.** Ao abrir o app (se online) + **pull-to-refresh** manual. Sem write-back,
  sem sync em background nesta fase.
- **Documentos.** No sync, baixar os binários do bucket `traveler-files` (via URL assinada; o path
  tem `trip_id` em `foldername[2]`) para o cache local. Guardar no SQLite o ponteiro + o estado de
  cache. Definir a política de limpeza/expiração de cache em `config.ts`.
- **`src/db/`** concentra schema SQLite, migrations locais e DAOs — **nada** de SQL espalhado pelas
  features.
- **`src/features/sync/`** é o motor de sincronização SQLite ⇄ Supabase.

## Estrutura de pastas (feature-based)
- `src/app/` — só roteamento/layout: `(auth)/` login, `(app)/trips/`, `(app)/travelers/[id]/`.
- `src/features/` — `auth`, `trips`, `travelers`, `health`, `documents`, `sync`. Cada feature
  isolada.
- `src/db/` — schema SQLite, migrations locais, DAOs.
- `src/lib/` — client Supabase, secure-store, filesystem, `config.ts`.
- `src/components/` e `src/theme/` — UI e tema compartilhados.

## Workflow / Harness Loop
- **Antes de declarar pronto**, no pacote mobile: rode `pnpm typecheck` e `pnpm lint`. Não afirme
  que funciona sem os dois passando.
- **Testes** (`tests/`) validam o determinístico: lógica de **sync** (cursor `updated_at`,
  server-wins, tratamento de `deleted_at`, merge no espelho), mapeamento row → SQLite → UI, e as
  regras reutilizadas de `@viagem/core`. Mexeu em sync/DAO? Rode os testes.
- **Pegadinha de setup:** os pacotes `@viagem/*` são **TS cru** (sem build). O `metro.config.js`
  precisa transpilar esses pacotes do workspace, senão o bundle quebra.
- **Mudou o schema remoto?** A migration continua vindo de `supabase/migrations/` (regra da raiz) →
  regerar tipos → e, se o espelho for afetado, atualizar as **migrations locais do SQLite** em
  `src/db/`.
- **Commits** em inglês, Conventional Commits. Não commitar sem eu pedir.

## Estilo
- **Idioma:** código e comentários em **inglês**; docs/conversa comigo em **português**; banco em
  inglês (regra da raiz).
- Feature-based: cada `features/<feature>/` isolada; `app/` só cuida de roteamento/layout.
- Código legível e direto; comentar só o não-óbvio. Sem over-engineering.
