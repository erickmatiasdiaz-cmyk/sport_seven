-- Migra el proveedor de pagos de MercadoPago a Transbank Webpay Plus.
-- Cambio aditivo: las columnas de MercadoPago (preferenceId) se conservan
-- nullable para no perder el historial de pagos anteriores.

ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'transbank';

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "buyOrder" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "authorizationCode" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paymentTypeCode" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "installments" INTEGER;

CREATE INDEX IF NOT EXISTS "payments_token_idx" ON "payments"("token");
