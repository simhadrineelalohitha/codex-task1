require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false, connectionTimeoutMillis: 5000 });

async function check() {
  const client = await pool.connect();
  try {
    // Tables
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('TABLES (' + tables.rows.length + '):');
    if (tables.rows.length === 0) {
      console.log('  (none — database is empty, migrations not run yet)');
    } else {
      for (const row of tables.rows) {
        try {
          const cnt = await client.query('SELECT COUNT(*) FROM "' + row.tablename + '"');
          console.log('  ' + row.tablename + ': ' + cnt.rows[0].count + ' rows');
        } catch(e) {
          console.log('  ' + row.tablename + ': (error: ' + e.message + ')');
        }
      }
    }

    // Extensions
    const ext = await client.query(
      "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp','pg_trgm')"
    );
    console.log('\nEXTENSIONS: ' + (ext.rows.map(r => r.extname).join(', ') || 'none installed'));

    // Check images column on products if table exists
    const imgCol = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' AND column_name IN ('images','metadata','sold_count') ORDER BY column_name"
    );
    if (imgCol.rows.length > 0) {
      console.log('\nPRODUCTS COLUMNS CHECK:');
      imgCol.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ') ✅'));
    }

  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
