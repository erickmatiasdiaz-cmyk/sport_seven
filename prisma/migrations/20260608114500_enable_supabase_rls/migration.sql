CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION btree_gist SET SCHEMA extensions;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blocked_slots" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "users" FROM anon, authenticated;
REVOKE ALL ON TABLE "courts" FROM anon, authenticated;
REVOKE ALL ON TABLE "reservations" FROM anon, authenticated;
REVOKE ALL ON TABLE "blocked_slots" FROM anon, authenticated;
