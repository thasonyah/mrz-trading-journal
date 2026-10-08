import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';

db.exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');

const applied = new Set(db.prepare('SELECT name FROM migrations').all().map((r) => r.name));
const dir = path.resolve('migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(dir, file), 'utf8');
  const apply = db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
  });
  apply();
  console.log(`Applied ${file}`);
}

console.log('Database is up to date');
