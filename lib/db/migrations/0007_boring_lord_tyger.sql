CREATE TYPE "public"."recurring_run_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" varchar(50) NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"byte_size" bigint NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_expense_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"recurring_id" text NOT NULL,
	"expense_id" text,
	"ran_at" timestamp DEFAULT now() NOT NULL,
	"status" "recurring_run_status" NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"payer_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"description" varchar(200) NOT NULL,
	"category_id" text,
	"notes" text,
	"split_mode" "split_mode" NOT NULL,
	"split_details" jsonb NOT NULL,
	"rrule" text NOT NULL,
	"dtstart" date NOT NULL,
	"next_run_at" timestamp NOT NULL,
	"last_run_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_comments" ADD CONSTRAINT "expense_comments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_comments" ADD CONSTRAINT "expense_comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expense_runs" ADD CONSTRAINT "recurring_expense_runs_recurring_id_recurring_expenses_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expense_runs" ADD CONSTRAINT "recurring_expense_runs_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_payer_id_user_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_workspace_name_unique" ON "expense_categories" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "expense_categories_workspace_id_idx" ON "expense_categories" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "expense_attachments_expense_id_idx" ON "expense_attachments" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "expense_attachments_created_at_idx" ON "expense_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "expense_comments_expense_id_idx" ON "expense_comments" USING btree ("expense_id");--> statement-breakpoint
CREATE INDEX "expense_comments_expense_created_idx" ON "expense_comments" USING btree ("expense_id","created_at");--> statement-breakpoint
CREATE INDEX "recurring_expense_runs_recurring_id_idx" ON "recurring_expense_runs" USING btree ("recurring_id");--> statement-breakpoint
CREATE INDEX "recurring_expense_runs_ran_at_idx" ON "recurring_expense_runs" USING btree ("ran_at");--> statement-breakpoint
CREATE INDEX "recurring_expenses_workspace_id_idx" ON "recurring_expenses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "recurring_expenses_next_run_at_idx" ON "recurring_expenses" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "recurring_expenses_active_next_idx" ON "recurring_expenses" USING btree ("active","next_run_at");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_category_id_idx" ON "expenses" USING btree ("category_id");