-- New member_role: group_leader. A group leader has the collaborator's read
-- access (is_trip_member is role-agnostic) plus the exclusive ability to file
-- and edit evangelism reports (see 0019). One role per membership, so this is a
-- distinct value alongside collaborator/administrator.
--
-- Isolated on purpose: Postgres cannot add an enum value and reference it as a
-- literal in the same transaction, so the table + policies that use
-- 'group_leader' live in the next migration (0019).
alter type public.member_role add value if not exists 'group_leader';
