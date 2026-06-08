CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "providerPaymentId" TEXT,
    "preferenceId" TEXT,
    "externalReference" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "checkoutUrl" TEXT,
    "rawStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_externalReference_key" ON "payments"("externalReference");
CREATE INDEX "payments_reservationId_idx" ON "payments"("reservationId");
CREATE INDEX "payments_providerPaymentId_idx" ON "payments"("providerPaymentId");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "reservations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments"
ADD CONSTRAINT "payments_status_check"
CHECK ("status" IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'));

ALTER TABLE "payments"
ADD CONSTRAINT "payments_amount_check"
CHECK ("amount" > 0);

ALTER TABLE "reservations" DROP CONSTRAINT "reservations_status_check";
ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_status_check"
CHECK ("status" IN ('pending', 'pending_payment', 'confirmed', 'cancelled', 'expired', 'payment_failed'));

ALTER TABLE "reservations" DROP CONSTRAINT "reservations_no_overlap";
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
WHERE ("status" IN ('pending', 'pending_payment', 'confirmed'));

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "payments" FROM anon, authenticated;

CREATE POLICY "deny_direct_api_access_payments"
ON "payments"
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
