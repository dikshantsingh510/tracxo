CREATE TABLE "master_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"action" varchar(64) NOT NULL,
	"subject_type" varchar(32) NOT NULL,
	"subject_id" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "master_audit_log" ADD CONSTRAINT "master_audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "master_audit_log_actor_id_idx" ON "master_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "master_audit_log_created_at_idx" ON "master_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "master_audit_log_subject_idx" ON "master_audit_log" USING btree ("subject_type","subject_id");