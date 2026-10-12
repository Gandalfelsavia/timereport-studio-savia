CREATE TYPE "public"."deadline_category" AS ENUM('FISCALE', 'CONTRIBUTIVO', 'ASSICURATIVO_LAVORO', 'DOGANALE', 'TERZO_SETTORE', 'TRIBUTO_LOCALE');--> statement-breakpoint
CREATE TYPE "public"."deadline_rule_type" AS ENUM('MONTHLY_DAY', 'ANNUAL_DATE', 'DAYS_AFTER_YEAR_END', 'MANUAL_YEARLY');--> statement-breakpoint
CREATE TABLE "fiscal_deadline_yearly_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deadline_id" uuid NOT NULL,
	"year" numeric(4, 0) NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"confirmed_by_user_id" uuid,
	"confirmed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_deadlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" "deadline_category" NOT NULL,
	"source" varchar(120) NOT NULL,
	"rule_type" "deadline_rule_type" NOT NULL,
	"rule_day" numeric(2, 0),
	"rule_month" numeric(2, 0),
	"rule_days_after_year_end" numeric(4, 0),
	"august_suspension" boolean DEFAULT false NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" numeric(5, 0) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fiscal_deadline_yearly_values" ADD CONSTRAINT "fiscal_deadline_yearly_values_deadline_id_fiscal_deadlines_id_fk" FOREIGN KEY ("deadline_id") REFERENCES "public"."fiscal_deadlines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_deadline_yearly_values" ADD CONSTRAINT "fiscal_deadline_yearly_values_confirmed_by_user_id_users_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;