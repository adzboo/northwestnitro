CREATE TABLE `result_meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`snapshot` text NOT NULL,
	`imported_at` text NOT NULL,
	`imported_by` text NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`table_count` integer NOT NULL,
	`row_count` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `result_meetings_date_idx` ON `result_meetings` (`date`);--> statement-breakpoint
CREATE TABLE `result_previews` (
	`user_id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`snapshot` text NOT NULL,
	`expires` text NOT NULL
);
