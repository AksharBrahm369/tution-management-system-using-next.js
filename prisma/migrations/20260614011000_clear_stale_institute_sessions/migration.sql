DELETE FROM "sessions" s
USING "users" u
WHERE s."userId" = u."id"
  AND s."instituteId" IS DISTINCT FROM u."instituteId";
