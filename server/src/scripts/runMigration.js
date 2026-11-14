import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('\n======================================================');
  console.log('   CivicMind Supabase Cloud PostgreSQL Migration Runner');
  console.log('======================================================\n');

  const migrationFilePath = path.resolve(__dirname, '../../../supabase/migrations/001_initial_schema.sql');

  if (!fs.existsSync(migrationFilePath)) {
    console.error(`Migration file not found at: ${migrationFilePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFilePath, 'utf8');

  // Strategy 1: If direct PostgreSQL connection string (DATABASE_URL) is present
  if (env.DATABASE_URL) {
    console.log('Connecting directly to Supabase PostgreSQL using DATABASE_URL...');
    const client = new pg.Client({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log('Connected! Executing 001_initial_schema.sql...');
      await client.query(sql);
      console.log('Migration executed successfully via direct PostgreSQL connection!\n');
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error('Failed to execute migration via PostgreSQL client:', err.message);
      await client.end();
      process.exit(1);
    }
  }

  // Strategy 2: Supabase REST checks
  console.log('Checking Supabase connection with service role key...');
  try {
    const { data, error } = await supabaseAdmin.from('departments').select('count', { count: 'exact', head: true });
    if (!error) {
      console.log('Tables are already present in Supabase Cloud database!');
      console.log('Departments count verified.');
    } else {
      console.log('Notice: departments table not reachable yet (Error:', error.message, ')');
      console.log('\nTo apply 001_initial_schema.sql to your Supabase Cloud project:');
      console.log('1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/<your-project-ref>/sql');
      console.log('2. Open the SQL Editor and click "New Query".');
      console.log('3. Copy and paste the contents of /supabase/migrations/001_initial_schema.sql');
      console.log('4. Click "Run" to create all tables, triggers, Haversine functions, and RLS policies.');
      console.log('\nAlternatively, provide your direct PostgreSQL connection string in server/.env:');
      console.log('DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\n');
    }
  } catch (err) {
    console.error('Supabase check encountered error:', err.message);
  }
}

runMigration();
