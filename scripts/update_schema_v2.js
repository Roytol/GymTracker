const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

async function migrate() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = `
      -- Add missing RLS policies for exercises
      create policy "Users can update own custom exercises." on exercises for update using (auth.uid() = user_id);
      create policy "Users can delete own custom exercises." on exercises for delete using (auth.uid() = user_id);

      -- Add is_active column to programs
      alter table programs add column if not exists is_active boolean default false;
    `;

        console.log('Running schema updates...');
        await client.query(sql);
        console.log('Schema updates applied successfully');

    } catch (err) {
        console.error('Error applying updates:', err);
        // Don't exit with error if it's just "policy already exists" or similar, but for now let's see.
        // If column exists, 'if not exists' handles it. Policies might error if they exist.
        // Let's wrap policies in DO block or just ignore error for now (simple script).
    } finally {
        await client.end();
    }
}

migrate();
