import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const configs = sqliteTable('configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  flavor: text('flavor').notNull(),
  baseUrl: text('base_url').notNull(),
  analyticsKey: text('analytics_key').notNull(),
  firebaseProjectId: text('firebase_project_id').notNull(),
});