ALTER TABLE "time_entries" ADD COLUMN "start_time" time(0);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "end_time" time(0);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "billing_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "expense_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "expense_note" varchar(255);