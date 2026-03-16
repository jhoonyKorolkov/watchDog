import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../database/schema';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Используем переменную окружения или дефолтный путь
const dbPath = process.env.DATABASE_URL || '.data/sqlite.db';

// Создаем директорию для БД, если её нет
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
