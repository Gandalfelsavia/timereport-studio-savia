CREATE TYPE "public"."quote_entity_key" AS ENUM('ABSV', 'RSVV', 'STUDIO_SAVIA');--> statement-breakpoint
CREATE TYPE "public"."quote_family" AS ENUM('SOCIETA', 'RAPPRESENTANZA_FISCALE', 'ETS_ASD', 'DITTA_INDIVIDUALE', 'FORFETTARIO');--> statement-breakpoint
CREATE TYPE "public"."quote_periodicity" AS ENUM('UNA_TANTUM', 'MENSILE', 'TRIMESTRALE', 'ANNUALE');--> statement-breakpoint
CREATE TYPE "public"."quote_pricing_mode" AS ENUM('ITEMIZED', 'FLAT');--> statement-breakpoint
CREATE TYPE "public"."quote_tariff_source" AS ENUM('ANC', 'UNIONE_GIOVANI', 'LIBERO');--> statement-breakpoint
CREATE TABLE "fee_schedule_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(255),
	"label" varchar(500) NOT NULL,
	"anc_amount" numeric(10, 2),
	"anc_note" text,
	"unione_giovani_amount" numeric(10, 2),
	"unione_giovani_note" text,
	"sort_order" numeric(5, 0) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "quote_entity_key" NOT NULL,
	"name" varchar(255) NOT NULL,
	"legal_form" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"tax_code" varchar(30) NOT NULL,
	"vat_number" varchar(30),
	"sdi_code" varchar(10),
	"pec" varchar(255),
	"phone" varchar(255),
	"signer_name" varchar(255) NOT NULL,
	"logo_file" varchar(255),
	"applies_ritenuta_cp" boolean DEFAULT false NOT NULL,
	"show_staff_roster" boolean DEFAULT false NOT NULL,
	"tariff_url" varchar(255),
	"insurance_note" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_entities_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "quote_entity_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"odcec_number" varchar(50),
	"sort_order" numeric(5, 0) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"sort_order" numeric(5, 0) DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"detail" text,
	"tariff_source" "quote_tariff_source" DEFAULT 'LIBERO' NOT NULL,
	"fee_schedule_item_id" uuid,
	"amount" numeric(10, 2),
	"periodicity" "quote_periodicity" DEFAULT 'UNA_TANTUM' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"client_id" uuid,
	"recipient_name" varchar(255) NOT NULL,
	"recipient_address" text,
	"family" "quote_family" NOT NULL,
	"pricing_mode" "quote_pricing_mode" DEFAULT 'ITEMIZED' NOT NULL,
	"title" varchar(500),
	"quote_date" date NOT NULL,
	"notes" text,
	"flat_annual_amount" numeric(10, 2),
	"discount_enabled" boolean DEFAULT false NOT NULL,
	"discount_label" varchar(500),
	"discount_kind" varchar(20),
	"discount_value" numeric(10, 2),
	"discount_line_ids" text,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_entity_staff" ADD CONSTRAINT "quote_entity_staff_entity_id_quote_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."quote_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_fee_schedule_item_id_fee_schedule_items_id_fk" FOREIGN KEY ("fee_schedule_item_id") REFERENCES "public"."fee_schedule_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_entity_id_quote_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."quote_entities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;