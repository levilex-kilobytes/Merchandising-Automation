import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../src/config/database';

async function run(): Promise<void> {
  const dir = join(__dirname, '..', 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  for (const file of files) {
    const { rowCount } = await pool.query(`SELECT 1 FROM _migrations WHERE name = $1`, [file]);
    if (rowCount && rowCount > 0) { console.log(`Skipping ${file}`); continue; }
    console.log(`Applying ${file}`);
    const sql = readFileSync(join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(`INSERT INTO _migrations (name) VALUES ($1)`, [file]);
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); console.error(`Failed ${file}:`, err); process.exit(1); }
    finally { client.release(); }
  }
  console.log('All migrations applied');
  await pool.end();
}
run().catch((err) => { console.error(err); process.exit(1); });
