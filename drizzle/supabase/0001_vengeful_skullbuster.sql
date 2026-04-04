ALTER TABLE "users" ADD COLUMN "auth_user_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_auth_user_id" ON "users" USING btree ("auth_user_id");