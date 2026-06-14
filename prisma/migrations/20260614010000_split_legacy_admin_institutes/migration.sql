-- Existing single-tenant installs may have multiple SUPER_ADMIN users that
-- were all backfilled into the same legacy institute. Split those admins into
-- their own institutes so one admin cannot see another admin's legacy data.
-- Business records stay with the original institute unless they can be
-- reassigned intentionally by a later, domain-aware repair.

INSERT INTO "institutes" ("id", "name", "slug", "ownerId", "createdAt", "updatedAt")
SELECT
  'legacy-admin-institute-' || u."id",
  COALESCE(NULLIF(u."name", ''), split_part(u."email", '@', 1)) || '''s Tuition',
  lower(regexp_replace(split_part(u."email", '@', 1), '[^a-zA-Z0-9]+', '-', 'g')) || '-tuition-' || substr(md5(u."id"), 1, 8),
  u."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users" u
WHERE u."role" = 'SUPER_ADMIN'
  AND NOT EXISTS (
    SELECT 1
    FROM "institutes" owned
    WHERE owned."ownerId" = u."id"
  )
ON CONFLICT ("id") DO NOTHING;

UPDATE "users" u
SET "instituteId" = owned."id"
FROM "institutes" owned
WHERE owned."ownerId" = u."id"
  AND u."role" = 'SUPER_ADMIN'
  AND u."instituteId" IS DISTINCT FROM owned."id";
