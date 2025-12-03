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
      -- Add units column to profiles
      alter table profiles add column if not exists units text default 'kg';
      
      -- Add week_start_day column to profiles
      alter table profiles add column if not exists week_start_day text default 'monday';
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
