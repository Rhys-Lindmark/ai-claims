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
