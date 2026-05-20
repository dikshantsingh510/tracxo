CREATE TYPE "public"."currency_code" AS ENUM('INR', 'USD', 'EUR', 'GBP', 'AUD', 'SGD');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "default_currency" "currency_code" DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "upi_vpa" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL;