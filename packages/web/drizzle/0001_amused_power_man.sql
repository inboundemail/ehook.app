-- Add webhook_id column (nullable to support existing workflows)
ALTER TABLE "workflows" ADD COLUMN "webhook_id" text;

-- Generate UUIDs for existing workflows
UPDATE "workflows" SET "webhook_id" = gen_random_uuid()::text WHERE "webhook_id" IS NULL;
