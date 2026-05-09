CREATE TABLE "resume_group" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resume_group_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "resume" ADD COLUMN "group_id" text;--> statement-breakpoint
CREATE INDEX "resume_user_id_group_id_index" ON "resume" ("user_id","group_id");--> statement-breakpoint
CREATE INDEX "resume_group_user_id_index" ON "resume_group" ("user_id");--> statement-breakpoint
ALTER TABLE "resume" ADD CONSTRAINT "resume_group_id_resume_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "resume_group"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "resume_group" ADD CONSTRAINT "resume_group_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;