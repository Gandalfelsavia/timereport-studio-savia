CREATE TYPE "public"."forfait_periodicity" AS ENUM('MENSILE', 'TRIMESTRALE', 'ANNUALE');--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "forfait_periodicity" "forfait_periodicity";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hourly_cost" numeric(8, 2);