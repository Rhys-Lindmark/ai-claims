CREATE TABLE `analysis_request_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`contract_version` text DEFAULT '1.0.0' NOT NULL,
	`request_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`from_state` text,
	`to_state` text NOT NULL,
	`attempt` integer NOT NULL,
	`public_summary` text NOT NULL,
	`occurred_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `analysis_requests`(`request_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "analysis_request_events_sequence_check" CHECK("analysis_request_events"."sequence" >= 1),
	CONSTRAINT "analysis_request_events_state_check" CHECK("analysis_request_events"."to_state" IN ('queued', 'in_review', 'published', 'failed')),
	CONSTRAINT "analysis_request_events_from_state_check" CHECK("analysis_request_events"."from_state" IS NULL OR "analysis_request_events"."from_state" IN ('queued', 'in_review', 'published', 'failed')),
	CONSTRAINT "analysis_request_events_attempt_check" CHECK("analysis_request_events"."attempt" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analysis_request_events_request_sequence_unique` ON `analysis_request_events` (`request_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `analysis_request_events_request_sequence_idx` ON `analysis_request_events` (`request_id`,`sequence`);