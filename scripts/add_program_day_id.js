
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using anon key for RLS policies if needed, but usually service role is better for migrations. 
// Actually, for schema changes we usually need direct SQL or a service role key if RLS is strict. 
// But previous scripts used the provided connection string or client. 
// Let's check previous migration scripts. 
// scripts/migrate.js uses 'pg' and a connection string. 
// scripts/update_schema_v2.js uses 'pg' and connection string.

const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database...');

        // Add program_day_id column to workouts table
        const query = `
      ALTER TABLE workouts 
      ADD COLUMN IF NOT EXISTS program_day_id uuid REFERENCES program_days(id) ON DELETE SET NULL;
    `;

        await client.query(query);
        console.log('Successfully added program_day_id to workouts table.');

    } catch (err) {
        console.error('Error executing migration:', err);
    } finally {
        await client.end();
    }
}

migrate();
