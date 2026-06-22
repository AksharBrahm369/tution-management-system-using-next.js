ALTER TABLE "sessions"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

CREATE TABLE IF NOT EXISTS "accounts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'accounts_userId_fkey'
  ) THEN
    ALTER TABLE "accounts"
    ADD CONSTRAINT "accounts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "verifications" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "verifications_identifier_idx" ON "verifications"("identifier");

INSERT INTO "accounts" (
  "id",
  "userId",
  "accountId",
  "providerId",
  "password",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "id",
  "id",
  'credential',
  "password",
  "createdAt",
  CURRENT_TIMESTAMP
FROM "users"
WHERE "password" IS NOT NULL
ON CONFLICT ("providerId", "accountId") DO UPDATE
SET "password" = EXCLUDED."password",
    "updatedAt" = CURRENT_TIMESTAMP;
