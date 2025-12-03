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

async function checkSchema() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `);
        console.log('Profiles table columns:', res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
