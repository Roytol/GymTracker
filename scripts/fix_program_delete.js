const { Client } = require('pg');
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
      -- Add missing DELETE policy for programs
      create policy "Users can delete own programs." on programs for delete using (auth.uid() = user_id);
    `;

        console.log('Running schema updates...');
        await client.query(sql);
        console.log('Schema updates applied successfully');

    } catch (err) {
        console.error('Error applying updates:', err);
    } finally {
        await client.end();
    }
}

migrate();
