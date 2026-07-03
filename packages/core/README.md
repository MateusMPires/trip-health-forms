# packages/core — Contrato de domínio

Fonte única de verdade do domínio, compartilhada entre web e mobile.

- `src/schemas/` — schemas Zod das entidades (organization, trip, traveler, guardian, health,
  document, consent).
- `src/types/` — tipos derivados dos schemas.
- `src/constants/` — enums e constantes (tipos de documento, faixas etárias, etc.).
- `src/validation/` — regras de negócio (ex.: `is_minor`, obrigatoriedade de dados do responsável).

Não deve depender de nenhum app (`apps/*`). Schemas serão definidos na Fase 1/2.
