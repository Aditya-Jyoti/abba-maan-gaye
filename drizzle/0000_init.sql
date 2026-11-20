CREATE TABLE "stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"place_key" text,
	"start_date" date,
	"end_date" date,
	"nights" integer,
	"title" text DEFAULT '' NOT NULL,
	"dek" text DEFAULT '' NOT NULL,
	"quote" text DEFAULT '' NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"story" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"see" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"eat" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"home_slot" integer,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"state_id" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"color_index" integer DEFAULT 0 NOT NULL,
	"cover_photo" jsonb,
	"home_slot" integer,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stops_trip_slug_idx" ON "stops" USING btree ("trip_id","slug");