require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function migrate() {
  console.log('🔄 Running database migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Always run schema (idempotent CREATE IF NOT EXISTS)
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'migrations', '001_schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Schema migration (001) complete');

    // Run fixes/indexes migration
    const fixesSQL = fs.readFileSync(path.join(__dirname, 'migrations', '003_fixes.sql'), 'utf8');
    await client.query(fixesSQL);
    console.log('✅ Fixes/indexes migration (003) complete');

    // Run seed if requested
    if (process.argv.includes('--seed')) {
      const seedSQL = fs.readFileSync(path.join(__dirname, 'migrations', '002_seed.sql'), 'utf8');
      await client.query(seedSQL);
      console.log('✅ Seed data (002) inserted');

      if (process.env.NODE_ENV !== 'production') {
        const demoUsersSQL = fs.readFileSync(path.join(__dirname, 'migrations', '004_demo_users.sql'), 'utf8');
        await client.query(demoUsersSQL);
        console.log('✅ Development demo users (004) inserted');
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Database setup complete!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
