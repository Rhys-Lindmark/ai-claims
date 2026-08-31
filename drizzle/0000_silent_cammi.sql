CREATE TABLE `analysis_requests` (
	`request_id` text PRIMARY KEY NOT NULL,
	`contract_version` text DEFAULT '1.0.0' NOT NULL,
	`entity_key` text NOT NULL,
	`canonical_url` text NOT NULL,
	`page_kind` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "analysis_requests_page_kind_check" CHECK("analysis_requests"."page_kind" IN ('youtube', 'goodreads', 'web')),
	CONSTRAINT "analysis_requests_state_check" CHECK("analysis_requests"."state" IN ('queued', 'in_review', 'published', 'failed')),
	CONSTRAINT "analysis_requests_attempt_check" CHECK("analysis_requests"."attempt" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analysis_requests_entity_key_unique` ON `analysis_requests` (`entity_key`);--> statement-breakpoint
CREATE INDEX `analysis_requests_state_updated_idx` ON `analysis_requests` (`state`,`updated_at`);