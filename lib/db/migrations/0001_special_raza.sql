ALTER TABLE "activity_log" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_share_non_negative" CHECK ("expense_splits"."share_amount" >= 0);--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_positive" CHECK ("expenses"."amount" > 0);--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_amount_positive" CHECK ("settlements"."amount" > 0);--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_no_self_pay" CHECK ("settlements"."from_user_id" <> "settlements"."to_user_id");