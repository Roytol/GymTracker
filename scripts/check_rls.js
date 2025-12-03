const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkRLS() {
    try {
        await client.connect();
        const res = await client.query(`
            select * from pg_policies where tablename = 'profiles';
        `);
        console.log('RLS Policies:', res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkRLS();
