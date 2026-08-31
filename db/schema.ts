import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const analysisRequests = sqliteTable('analysis_requests', {
  requestId: text('request_id').primaryKey(),
  contractVersion: text('contract_version').notNull().default('1.0.0'),
  entityKey: text('entity_key').notNull(),
  canonicalUrl: text('canonical_url').notNull(),
  pageKind: text('page_kind').notNull(),
  state: text('state').notNull().default('queued'),
  attempt: integer('attempt').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  uniqueIndex('analysis_requests_entity_key_unique').on(table.entityKey),
  index('analysis_requests_state_updated_idx').on(table.state, table.updatedAt),
  check('analysis_requests_page_kind_check', sql`${table.pageKind} IN ('youtube', 'goodreads', 'web')`),
  check('analysis_requests_state_check', sql`${table.state} IN ('queued', 'in_review', 'published', 'failed')`),
  check('analysis_requests_attempt_check', sql`${table.attempt} >= 1`),
]);

export const analysisRequestEvents = sqliteTable('analysis_request_events', {
  eventId: text('event_id').primaryKey(),
  contractVersion: text('contract_version').notNull().default('1.0.0'),
  requestId: text('request_id').notNull().references(() => analysisRequests.requestId, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  fromState: text('from_state'),
  toState: text('to_state').notNull(),
  attempt: integer('attempt').notNull(),
  publicSummary: text('public_summary').notNull(),
  occurredAt: text('occurred_at').notNull(),
}, (table) => [
  uniqueIndex('analysis_request_events_request_sequence_unique').on(table.requestId, table.sequence),
  index('analysis_request_events_request_sequence_idx').on(table.requestId, table.sequence),
  check('analysis_request_events_sequence_check', sql`${table.sequence} >= 1`),
  check('analysis_request_events_state_check', sql`${table.toState} IN ('queued', 'in_review', 'published', 'failed')`),
  check('analysis_request_events_from_state_check', sql`${table.fromState} IS NULL OR ${table.fromState} IN ('queued', 'in_review', 'published', 'failed')`),
  check('analysis_request_events_attempt_check', sql`${table.attempt} >= 1`),
]);
