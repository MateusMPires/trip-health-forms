# CLAUDE.md — Convenções do projeto

> As regras permanentes da casa. Valem pra TODA tarefa, independente da feature.
> (Specs dizem o quê; isto diz como me comportar e o que nunca fazer.)

## O que é este projeto
Plataforma para capturar, armazenar e consultar os dados de cada viajante de uma viagem
missionária — dados pessoais, informações de saúde e documentos/autorizações — e disponibilizá-los
aos líderes da viagem, **online e offline**.

Duas superfícies:
- **Formulário web** (`apps/web`): cadastro do viajante por **link público** com código da viagem,
  sem conta. Coleta dados pessoais, saúde, documentos, consentimento LGPD e, para menores, dados do
  responsável.
- **App mobile** (`apps/mobile`): líderes fazem **login** e consultam os viajantes de suas viagens.
  Funciona **offline** (SQLite espelhando o Supabase).

## Stack
- **Monorepo:** Turborepo + pnpm workspaces. Gerenciador é sempre `pnpm`.
- **Web:** Next.js (App Router) + TypeScript.
- **Mobile:** Expo + EAS, React Native, expo-router, SQLite (expo-sqlite / op-sqlite).
- **Backend:** Supabase (Postgres + Auth + Storage), multi-tenant (multi-organização) com RLS.
- **Domínio/validação:** Zod em `packages/core` — contrato único do "viajante", reutilizado por web
  e mobile. Acesso a dados via `packages/supabase`.
- **Distribuição:** EAS Build → TestFlight (iOS) e Firebase App Distribution (Android).
- **Sync:** pull-based (server-wins); o app é read-mostly.
- Parâmetros e constantes vivem em `src/lib/config.ts` de cada app. Segredos e URLs vêm do `.env`.

## Regras invioláveis
- **Banco em inglês.** Todas as tabelas, colunas, regras, policies e buckets do Supabase em
  **inglês**, `snake_case`, tabelas no **plural** (ex.: `travelers`, `health_records`). Sem exceção.
- **Segredos só no `.env`.** Nada de chave/URL/token hardcoded no código. Nunca commitar `.env`
  (só `.env.example`). `SUPABASE_SERVICE_ROLE_KEY` é **server-side apenas** — nunca no client/app.
- **Migrations sempre versionadas** em `supabase/migrations/`. Nenhuma mudança de schema fora daí
  (nada de alterar o banco "na mão" sem migration). Após migration, regenere os tipos
  (`supabase gen types`) e atualize `packages/supabase`.
- **RLS sempre ligada.** Toda tabela nasce com RLS habilitada e policies explícitas. Nenhuma tabela
  exposta sem policy. O formulário público **escreve** (insert restrito por código da viagem), mas
  **nunca lê** dados (sem `select` público).
- **Isolamento multi-tenant.** Toda query respeita o tenant (organização). Nunca cruzar dados entre
  organizações. Líder só acessa as viagens que lidera.
- **Consentimento obrigatório.** Não persistir dados de saúde ou de menores sem o registro de
  consentimento LGPD correspondente.
- **Nunca logar dados sensíveis.** Proibido logar, printar ou enviar a analytics/crash reports:
  dados de saúde, documentos e dados pessoais de menores.
- **Parâmetros só em `config.ts`.** Modelo de dado configurável (ex.: tamanhos, limites, top-level
  constants) vive em `src/lib/config.ts`. Nunca hardcode valor mágico no meio do código.
- **Contrato de domínio compartilhado.** O schema do viajante é definido **uma vez** em
  `packages/core` (Zod) e reutilizado. Não duplicar validação/tipos entre web e mobile.

## Workflow / Harness Loop
- **Antes de declarar pronto**, no pacote afetado: rode `pnpm typecheck` e `pnpm lint`. Não afirme
  que funciona sem os dois passando.
- **Testes** (`tests/`) validam o que é **determinístico**: schemas Zod, parsing, regras de negócio
  (ex.: `is_minor`, obrigatoriedade de responsável) e lógica de sync. Mudou algo aí? Rode os testes.
- **Uma spec só está 'pronta'** quando todos os critérios de aceite passam (typecheck + lint +
  testes relevantes). Não declare concluído sem rodar.
- **Mudou o schema?** Migration em `supabase/migrations/` → regerar tipos → revisar RLS da(s)
  tabela(s) nova(s) antes de seguir.
- **Commits** em inglês, no padrão Conventional Commits (`feat:`, `fix:`, `chore:`…). Não commitar
  sem eu pedir.

## Estilo
- **Idioma:** código (nomes de variáveis, funções, componentes) e comentários em **inglês**;
  README/docs e conversa comigo em **português**. Banco em inglês (regra acima).
- Feature-based: cada `features/<feature>/` isolada; `app/` só cuida de roteamento/layout.
  `packages/core` não depende de nenhum app.
- Começar pequeno e ver funcionar antes de generalizar. Nada de over-engineering.
- Código legível e direto; comentar só o não-óbvio.
