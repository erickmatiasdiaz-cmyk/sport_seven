CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "users"
ADD CONSTRAINT "users_role_check"
CHECK ("role" IN ('user', 'admin'));

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_status_check"
CHECK ("status" IN ('pending', 'confirmed', 'cancelled'));

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_duration_check"
CHECK ("durationMinutes" IN (60, 90));

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_time_order_check"
CHECK (
  "startTime" ~ '^[0-9]{2}:[0-9]{2}$'
  AND "endTime" ~ '^[0-9]{2}:[0-9]{2}$'
  AND (
    split_part("startTime", ':', 1)::int * 60 + split_part("startTime", ':', 2)::int
  ) < (
    split_part("endTime", ':', 1)::int * 60 + split_part("endTime", ':', 2)::int
  )
);

ALTER TABLE "blocked_slots"
ADD CONSTRAINT "blocked_slots_time_order_check"
CHECK (
  "startTime" ~ '^[0-9]{2}:[0-9]{2}$'
  AND "endTime" ~ '^[0-9]{2}:[0-9]{2}$'
  AND (
    split_part("startTime", ':', 1)::int * 60 + split_part("startTime", ':', 2)::int
  ) < (
    split_part("endTime", ':', 1)::int * 60 + split_part("endTime", ':', 2)::int
  )
);

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_no_overlap"
EXCLUDE USING gist (
  "courtId" WITH =,
  "date" WITH =,
  int4range(
    split_part("startTime", ':', 1)::int * 60 + split_part("startTime", ':', 2)::int,
    split_part("endTime", ':', 1)::int * 60 + split_part("endTime", ':', 2)::int,
    '[)'
  ) WITH &&
)
WHERE ("status" IN ('pending', 'confirmed'));

ALTER TABLE "blocked_slots"
ADD CONSTRAINT "blocked_slots_no_overlap"
EXCLUDE USING gist (
  "courtId" WITH =,
  "date" WITH =,
  int4range(
    split_part("startTime", ':', 1)::int * 60 + split_part("startTime", ':', 2)::int,
    split_part("endTime", ':', 1)::int * 60 + split_part("endTime", ':', 2)::int,
    '[)'
  ) WITH &&
);
