# apps/mobile — App dos líderes

App React Native (Expo + expo-router) que lista os viajantes de cada viagem e seus detalhes.
Requer login (Supabase Auth) e funciona **offline** via SQLite (SQLCipher) espelhando o Supabase.

**Design:** minimalista e monocromático, inspirado no app Contatos da Apple. Navegação com
componentes **nativos** de cada plataforma: `NativeTabs` (UITabBar / BottomNavigation), native
stack com large titles e barra de busca nativa no header.

**Estrutura (feature-based):**
- `src/app/` — rotas: `(auth)/` login, `(app)/(tabs)/` viagens + ajustes, `(app)/travelers/[id]`.
- `src/features/` — `auth`, `trips`, `travelers`, `documents`, `health`, `settings` e `sync`
  (motor de sincronização pull-based, server-wins, cursor por `updated_at`).
- `src/db/` — schema SQLite, migrations locais (`PRAGMA user_version`) e DAOs.
- `src/{lib,components,theme}/` — Supabase/secure-store/config, UI compartilhada e tema.

## Rodando

```bash
# na raiz do monorepo
pnpm install

# runtime env (copie e preencha com a anon key do projeto)
cp apps/mobile/.env.example apps/mobile/.env

cd apps/mobile
pnpm dev            # Expo Go (sem SQLCipher — o PRAGMA key vira no-op)
pnpm ios            # dev build nativa (SQLCipher ativo)
pnpm android
```

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Os testes cobrem o determinístico: serialização row → espelho SQLite, avanço do cursor de sync
e o agrupamento/busca da lista de viajantes.

Distribuição via EAS Build → TestFlight (iOS) e Firebase App Distribution (Android).
