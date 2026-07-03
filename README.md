# Viagem Missionária

Plataforma para **capturar, armazenar e consultar** os dados de cada viajante de uma viagem
missionária — dados pessoais, informações de saúde e documentos/autorizações — disponibilizando
essas informações aos **líderes da viagem**, com acesso **online e offline**.

---

## 1. Visão geral

O produto tem duas superfícies:

| Superfície | O que é | Quem usa | Acesso |
|-----------|---------|----------|--------|
| **Formulário web** | Formulário customizado multi-etapas para o cadastro do viajante (dados pessoais, saúde, documentos, consentimento LGPD e, para menores, dados do responsável). | Viajante (ou responsável) | **Link público** com código da viagem, sem conta |
| **App mobile** | App React Native que lista todos os viajantes de uma viagem e seus detalhes. Funciona **offline**. | Líderes da viagem | **Login** (Supabase Auth) |

Os dados são coletados no formulário, armazenados no **Supabase** e sincronizados para o
armazenamento **local (SQLite)** do app, permitindo que os líderes consultem tudo mesmo sem
internet durante a viagem.

---

## 2. Arquitetura

```
┌──────────────────────┐        ┌──────────────────────┐
│   Formulário Web      │        │     App Mobile        │
│   (Next.js, público)  │        │  (Expo/React Native)  │
│                       │        │  login dos líderes    │
└──────────┬───────────┘        └───────────┬──────────┘
           │ escrita (insert)               │ pull sync + leitura
           ▼                                ▼
        ┌────────────────────────────────────────┐
        │              Supabase                    │
        │  Postgres (RLS) · Auth · Storage         │
        └────────────────────────────────────────┘
                          ▲
                          │ contrato de domínio compartilhado
                 ┌────────┴─────────┐
                 │  packages/core    │  (schemas Zod, tipos, regras)
                 │  packages/supabase│  (client + tipos gerados)
                 └───────────────────┘
```

- O **viajante** (dados pessoais + saúde + documentos + consentimento) é o mesmo contrato nas duas
  superfícies. Ele é definido **uma única vez** em `packages/core` e reutilizado por web e mobile,
  evitando divergência de schema.
- O app é **read-mostly**: sincroniza (pull) os dados do Supabase para o SQLite e resolve conflitos
  com *server-wins*.

---

## 3. Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Web:** Next.js (App Router), TypeScript
- **Mobile:** Expo + EAS, React Native, expo-router, SQLite (expo-sqlite / op-sqlite)
- **Backend:** Supabase (Postgres + Auth + Storage), multi-tenant com RLS
- **Validação/domínio:** Zod (em `packages/core`)
- **Distribuição:** EAS Build → **TestFlight** (iOS) e **Firebase App Distribution** (Android)

---

## 4. Estrutura de pastas

```
viagem-missionaria/
├── apps/
│   ├── web/        # Next.js — formulário público do viajante
│   └── mobile/     # Expo (React Native) — app dos líderes
├── packages/
│   ├── core/       # domínio compartilhado: schemas Zod, tipos, regras, constantes
│   ├── supabase/   # client Supabase + tipos gerados + queries reutilizáveis
│   ├── ui/         # (opcional) design tokens compartilhados
│   └── config/     # tsconfig / eslint / prettier compartilhados
├── supabase/       # migrations, políticas RLS, seed, edge functions
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Cada app é **feature-based**: `app/` cuida apenas de roteamento/layout e cada `features/<feature>/`
concentra components, hooks e acesso a dados daquela funcionalidade.

**`apps/web/src`**
```
app/                          # App Router (roteamento/layout)
  (public)/viagem/[codigo]/   # formulário público por código da viagem
features/
  traveler-form/  steps/ components/ hooks/   # formulário multi-etapas
  documents/                  # upload → Supabase Storage
  health-info/                # bloco de saúde
  consent/                    # LGPD + autorização de menores
components/  lib/  styles/
```

**`apps/mobile/src`**
```
app/                          # expo-router
  (auth)/                     # login
  (app)/trips/                # lista de viagens do líder
  (app)/travelers/[id]/       # detalhe do viajante
features/
  auth/  trips/  travelers/  documents/  health/
  sync/                       # motor de sincronização SQLite ⇄ Supabase
db/  lib/  components/  theme/
```

**`packages/core/src`**
```
schemas/  types/  constants/  validation/
```

---

## 5. Pré-requisitos

- **Node** ≥ 20
- **pnpm** ≥ 9
- **Supabase CLI** (migrations, tipos, ambiente local)
- **EAS CLI** (`eas-cli`) para builds do app mobile
- Contas: Supabase, Apple Developer (TestFlight), Firebase (App Distribution)

---

## 6. Setup

```bash
# 1. Instalar dependências de todo o workspace
pnpm install

# 2. Configurar variáveis de ambiente (copie e preencha)
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env

# 3. Banco de dados (a partir da Fase 1)
supabase start          # ambiente local
supabase db reset       # aplica migrations + seed
```

> As migrations e o schema ainda **não** estão definidos — ver Fase 1 no roadmap.

---

## 7. Rodando

```bash
pnpm dev                        # roda todas as tarefas dev (turbo)

pnpm --filter web dev           # apenas o formulário web (Next.js)
pnpm --filter mobile start      # apenas o app (Expo)
```

---

## 8. Build & distribuição

O app mobile é buildado com **EAS Build** e distribuído nas plataformas de teste:

```bash
# iOS → TestFlight
eas build --platform ios --profile preview
eas submit --platform ios

# Android → Firebase App Distribution
eas build --platform android --profile preview
# (upload do artefato para o Firebase App Distribution via CLI/console)
```

Os perfis de build ficam em `apps/mobile/eas.json` (criado na Fase 5).

---

## 9. Modelo de dados & LGPD

> **O schema ainda não está definido** — a modelagem detalhada (tabelas, colunas, tipos, relações,
> migrations e RLS) será feita na **Fase 1**.

**Convenção obrigatória:** todas as **tabelas e colunas do Supabase em inglês**, `snake_case`,
tabelas no plural (ex.: `travelers`, `health_records`). Isso mantém o banco alinhado aos tipos
gerados em `packages/supabase` e ao contrato de domínio em `packages/core`.

**Entidades conceituais** (alto nível, sem colunas nesta fase): organizações (tenant),
líderes/membros, viagens, viajantes, responsáveis (menores), dados de saúde, documentos e
consentimentos.

**Diretrizes de acesso e privacidade:**
- Multi-tenant com **RLS por organização**; cada líder só enxerga as viagens que lidera.
- **Formulário público:** escrita via link com código da viagem (insert restrito, sem leitura
  pública). Storage em buckets privados; leitura apenas autenticada.
- **Dados sensíveis** (saúde) e de **menores** (autorização do responsável) têm consentimento
  LGPD registrado; política de retenção/exclusão definida na Fase 6.

---

## 10. Roadmap por fases

| Fase | Objetivo |
|------|----------|
| **0 — Fundação** | Scaffold do monorepo, projeto Supabase, `.env.example`, CI, EAS/Firebase. |
| **1 — Modelo de dados** | Definição do schema (tabelas/colunas **em inglês**), migrations, RLS, seed e tipos gerados em `packages/supabase`. |
| **2 — Formulário web** | Multi-etapas, upload de documentos, bloco de saúde, consentimento LGPD e responsável do menor. |
| **3 — App (online)** | Login, lista de viagens, lista e detalhe do viajante. |
| **4 — Offline** | Schema SQLite, motor de sync (pull) e cache de arquivos. |
| **5 — Distribuição** | Builds EAS → TestFlight + Firebase App Distribution. |
| **6 — Hardening** | Revisão LGPD/segurança, testes, política de retenção/exclusão de dados. |

---

## Licença

Uso interno / privado. Defina a licença conforme a política da organização.
