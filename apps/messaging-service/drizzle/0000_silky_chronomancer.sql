CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('ACTIVE', 'ARCHIVED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('SENT', 'DELETED');--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"status" "conversation_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_message_id" uuid,
	"last_message_at" timestamp (6) with time zone,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_read_state" (
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"last_read_message_id" uuid,
	"last_read_at" timestamp (6) with time zone,
	"muted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_conversation_read_state" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"status" "message_status" DEFAULT 'SENT' NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_read_state" ADD CONSTRAINT "conversation_read_state_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_conversation_listing_buyer_seller" ON "conversation" USING btree ("listing_id","buyer_id","seller_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_buyer_updated" ON "conversation" USING btree ("buyer_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_conversation_seller_updated" ON "conversation" USING btree ("seller_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_conversation_listing" ON "conversation" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_read_state_user" ON "conversation_read_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_message_conversation_created" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_message_sender" ON "message" USING btree ("sender_id");
