# supabase — Backend

Configuração do backend Supabase (gerenciada via Supabase CLI).

- `migrations/` — migrations SQL versionadas (schema em **inglês / `snake_case`**).
- `policies/` — políticas RLS (multi-tenant por organização).
- `seed/` — dados de seed para ambiente local/dev.
- `functions/` — edge functions (ex.: insert restrito do formulário público por código da viagem).

> Schema e políticas serão definidos na **Fase 1**.
