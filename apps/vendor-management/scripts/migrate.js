"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = require("../src/config/database");
async function run() {
    const dir = (0, path_1.join)(__dirname, '..', 'migrations');
    const files = (0, fs_1.readdirSync)(dir).filter((f) => f.endsWith('.sql')).sort();
    await database_1.pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
    for (const file of files) {
        const { rowCount } = await database_1.pool.query(`SELECT 1 FROM _migrations WHERE name = $1`, [file]);
        if (rowCount && rowCount > 0) {
            console.log(JSON.stringify({ level: 'info', msg: `Skipping ${file}` }));
            continue;
        }
        const sql = (0, fs_1.readFileSync)((0, path_1.join)(dir, file), 'utf8');
        console.log(JSON.stringify({ level: 'info', msg: `Applying ${file}` }));
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query(`INSERT INTO _migrations (name) VALUES ($1)`, [file]);
            await client.query('COMMIT');
        }
        catch (err) {
            await client.query('ROLLBACK');
            console.error(JSON.stringify({ level: 'error', msg: `Failed ${file}`, err: String(err) }));
            process.exit(1);
        }
        finally {
            client.release();
        }
    }
    console.log(JSON.stringify({ level: 'info', msg: 'All migrations applied' }));
    await database_1.pool.end();
}
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map