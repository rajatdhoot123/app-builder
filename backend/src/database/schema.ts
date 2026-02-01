import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const configs = sqliteTable('configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  app: text('app').notNull(),
  flavor: text('flavor').notNull(),
  config: text('config').notNull(), // JSON string
}, (table) => ({
  appFlavorUnique: uniqueIndex('app_flavor_unique').on(table.app, table.flavor),
}));

export const templates = sqliteTable('templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  config: text('config').notNull(), // JSON string
});