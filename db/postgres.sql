CREATE TABLE "series" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created" text NOT NULL
);

CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"starts" text NOT NULL,
	"ends" text NOT NULL,
	"cutoff" text NOT NULL,
	"capacity" integer NOT NULL,
	"member_price" integer NOT NULL,
	"guest_price" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created" text NOT NULL
);

CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"brca" text NOT NULL,
	"plan" text NOT NULL,
	"guardian" text DEFAULT '' NOT NULL,
	"number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"payment" text DEFAULT 'unpaid' NOT NULL,
	"expires" text,
	"created" text NOT NULL
);

CREATE TABLE "entries" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"brca" text NOT NULL,
	"race_class" text NOT NULL,
	"transponder" text DEFAULT '' NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"payment" text DEFAULT 'unpaid' NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"stripe_session" text,
	"created" text NOT NULL,
	FOREIGN KEY ("event_id") REFERENCES "events"("id") ON UPDATE no action ON DELETE no action
);

CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);

CREATE TABLE "audit" (
	"id" text PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"created" text NOT NULL
);

CREATE TABLE "result_meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"snapshot" text NOT NULL,
	"imported_at" text NOT NULL,
	"imported_by" text NOT NULL,
	"published" integer DEFAULT 1 NOT NULL,
	"table_count" integer NOT NULL,
	"row_count" integer NOT NULL
);

CREATE TABLE "result_previews" (
	"user_id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"snapshot" text NOT NULL,
	"expires" text NOT NULL
);

CREATE UNIQUE INDEX "entries_event_user_unique" ON "entries" ("event_id","user_id");

CREATE INDEX "entries_user_idx" ON "entries" ("user_id");

CREATE INDEX "events_starts_idx" ON "events" ("starts");

CREATE UNIQUE INDEX "members_number_unique" ON "members" ("number");

CREATE UNIQUE INDEX "members_email_unique" ON "members" ("email");

CREATE INDEX "result_meetings_date_idx" ON "result_meetings" ("date");

CREATE UNIQUE INDEX "series_name_unique" ON "series" ("name");

ALTER TABLE "events" ADD "series_id" text REFERENCES series(id);
CREATE UNIQUE INDEX series_name_lower_unique ON series (lower(name));
