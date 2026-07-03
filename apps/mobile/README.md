# apps/mobile — App dos líderes

App React Native (Expo + expo-router) que lista os viajantes de cada viagem e seus detalhes.
Requer login (Supabase Auth) e funciona **offline** via SQLite.

**Estrutura (feature-based):**
- `src/app/` — rotas: `(auth)/` login, `(app)/trips/`, `(app)/travelers/[id]/`.
- `src/features/` — `auth`, `trips`, `travelers`, `documents`, `health` e `sync` (motor de
  sincronização SQLite ⇄ Supabase).
- `src/db/` — schema SQLite, migrations locais e DAOs.
- `src/{lib,components,theme}/` — Supabase/secure-store/filesystem, UI e tema.

Distribuição via EAS Build → TestFlight (iOS) e Firebase App Distribution (Android).
