CREATE POLICY "deny_direct_api_access_users"
ON "users"
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_direct_api_access_courts"
ON "courts"
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_direct_api_access_reservations"
ON "reservations"
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_direct_api_access_blocked_slots"
ON "blocked_slots"
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
