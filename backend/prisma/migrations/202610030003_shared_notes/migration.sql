CREATE TABLE "note_shares" (
    "id" UUID NOT NULL,
    "summary_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "note_shares_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "note_shares_role_check" CHECK ("role" IN ('VIEWER', 'EDITOR'))
);

CREATE UNIQUE INDEX "note_shares_summary_id_user_id_key" ON "note_shares"("summary_id", "user_id");
CREATE INDEX "note_shares_user_id_created_at_idx" ON "note_shares"("user_id", "created_at");

ALTER TABLE "note_shares" ADD CONSTRAINT "note_shares_summary_id_fkey"
    FOREIGN KEY ("summary_id") REFERENCES "summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "note_shares" ADD CONSTRAINT "note_shares_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
