CREATE TYPE "public"."todo_status" AS ENUM('pending', 'done', 'cancelled', 'deleted');--> statement-breakpoint
CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"status" "todo_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"parent_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"created_date" date DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_todos_parent_id" ON "todos" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_todos_created_date" ON "todos" USING btree ("created_date");--> statement-breakpoint
CREATE INDEX "idx_todos_status" ON "todos" USING btree ("status");