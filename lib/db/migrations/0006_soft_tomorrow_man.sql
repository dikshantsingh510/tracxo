CREATE TYPE "public"."feedback_status" AS ENUM('new', 'triaged', 'resolved', 'wont_fix');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'idea', 'general', 'praise');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"type" "feedback_type" DEFAULT 'general' NOT NULL,
	"message" text NOT NULL,
	"page_url" varchar(500),
	"user_agent" varchar(500),
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" USING btree ("user_id");