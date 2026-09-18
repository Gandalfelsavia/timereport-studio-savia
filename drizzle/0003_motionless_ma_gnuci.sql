ALTER TABLE "clients" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "vat_number" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tax_code" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "sdi_code" varchar(10);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "pec" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "has_legal_representative" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_birth_date" date;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_birth_place" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "legal_rep_residence" text;