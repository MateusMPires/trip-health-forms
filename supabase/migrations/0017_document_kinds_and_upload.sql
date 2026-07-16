-- Two new document kinds uploaded by trip admins from the mobile app:
--   commitment_term              — Termo de Compromisso (every traveler)
--   national_travel_authorization — Autorização de Viagem Nacional (travelers under 16)
--
-- No RLS/storage changes needed: the documents and storage.objects policies already
-- gate insert/update/delete on is_trip_admin(trip_id) (see 0010_documents.sql,
-- 0011_storage.sql), which covers these kinds too.
--
-- Note: `alter type ... add value` cannot be used in the same transaction that adds it,
-- so this migration only adds the values (they are first used at runtime, never here).
alter type public.document_kind add value if not exists 'commitment_term';
alter type public.document_kind add value if not exists 'national_travel_authorization';
