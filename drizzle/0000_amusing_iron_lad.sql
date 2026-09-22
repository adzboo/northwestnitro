CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`brca` text NOT NULL,
	`race_class` text NOT NULL,
	`transponder` text DEFAULT '' NOT NULL,
	`amount` integer NOT NULL,
	`method` text NOT NULL,
	`payment` text DEFAULT 'unpaid' NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`stripe_session` text,
	`created` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_event_user_unique` ON `entries` (`event_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `entries_user_idx` ON `entries` (`user_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`starts` text NOT NULL,
	`ends` text NOT NULL,
	`cutoff` text NOT NULL,
	`capacity` integer NOT NULL,
	`member_price` integer NOT NULL,
	`guest_price` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_starts_idx` ON `events` (`starts`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`brca` text NOT NULL,
	`plan` text NOT NULL,
	`guardian` text DEFAULT '' NOT NULL,
	`number` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`payment` text DEFAULT 'unpaid' NOT NULL,
	`expires` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_number_unique` ON `members` (`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
