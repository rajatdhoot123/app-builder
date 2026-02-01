import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/better-sqlite3';
const Database = require('better-sqlite3');
import * as schema from './schema';

@Injectable()
export class DatabaseService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sqlite = new Database('database.db');
    // Drop and recreate tables to handle schema changes
    sqlite.exec(`DROP TABLE IF EXISTS configs;`);
    sqlite.exec(`DROP TABLE IF EXISTS templates;`);
    sqlite.exec(`
      CREATE TABLE configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app TEXT NOT NULL,
        flavor TEXT NOT NULL,
        config TEXT NOT NULL
      );
    `);
    sqlite.exec(`CREATE UNIQUE INDEX app_flavor_unique ON configs (app, flavor);`);
    sqlite.exec(`
      CREATE TABLE templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        config TEXT NOT NULL
      );
    `);
    this.db = drizzle(sqlite, { schema });
  }

  getDb() {
    return this.db;
  }
}