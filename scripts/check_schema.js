const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

async function checkSchema() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `);
        console.log('Columns in profiles table:', res.rows);
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
