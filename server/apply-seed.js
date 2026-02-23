/**
 * apply-seed.js — Execute a SQL seed file using a fresh mysql2 connection
 *   with multipleStatements:true so the entire file runs as one batch.
 * Usage:  node server/apply-seed.js <path-to-sql-file>
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const sqlFile = path.resolve(process.argv[2] || '../database/seed-npa-001-digital-asset-custody.sql');

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,   // ← execute the whole file at once
    });

    try {
        console.log(`Connected to ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        const sql = fs.readFileSync(sqlFile, 'utf8');
        console.log(`Executing: ${sqlFile} (${sql.length} bytes)`);

        await conn.query(sql);
        console.log('SQL executed successfully.');

        // Verification
        const [rows] = await conn.query(
            "SELECT project_id, COUNT(*) AS cnt FROM npa_form_data GROUP BY project_id ORDER BY project_id"
        );
        console.log('All NPA form_data counts:', JSON.stringify(rows));

    } catch (err) {
        console.error('Error:', err.message);
        if (err.sql) console.error('SQL context:', err.sql.slice(0, 200));
        process.exit(1);
    } finally {
        await conn.end();
        process.exit(0);
    }
})();
