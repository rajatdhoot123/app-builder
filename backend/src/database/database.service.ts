import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/better-sqlite3';
const Database = require('better-sqlite3');
import * as schema from './schema';

@Injectable()
export class DatabaseService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sqlite = new Database('database.db');
    this.db = drizzle(sqlite, { schema });
  }

  getDb() {
    return this.db;
  }
}