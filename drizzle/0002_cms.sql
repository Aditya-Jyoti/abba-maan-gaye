CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" integer NOT NULL,
	"original_name" text DEFAULT '' NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stop_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stop_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" uuid
);
--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "pin_x" real;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "pin_y" real;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "draft" jsonb;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "draft_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "draft_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN "draft_updated_by" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stop_revisions" ADD CONSTRAINT "stop_revisions_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stop_revisions" ADD CONSTRAINT "stop_revisions_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stop_revisions_stop_idx" ON "stop_revisions" USING btree ("stop_id","published_at");--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_draft_updated_by_users_id_fk" FOREIGN KEY ("draft_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;