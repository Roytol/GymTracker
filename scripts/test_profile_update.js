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

async function testUpdate() {
    try {
        await client.connect();

        // Get a user
        const userRes = await client.query('SELECT id, email FROM auth.users LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log('No users found');
            return;
        }
        const userId = userRes.rows[0].id;
        console.log('Testing with user:', userId, userRes.rows[0].email);

        // Check current profile
        const profileRes = await client.query('SELECT * FROM profiles WHERE id = $1', [userId]);
        console.log('Current profile:', profileRes.rows[0]);

        // Update to sunday
        console.log('Updating to sunday...');
        await client.query("UPDATE profiles SET week_start_day = 'sunday' WHERE id = $1", [userId]);

        // Check again
        const profileRes2 = await client.query('SELECT * FROM profiles WHERE id = $1', [userId]);
        console.log('Profile after update:', profileRes2.rows[0]);

        // Update back to monday
        console.log('Updating to monday...');
        await client.query("UPDATE profiles SET week_start_day = 'monday' WHERE id = $1", [userId]);

        // Check again
        const profileRes3 = await client.query('SELECT * FROM profiles WHERE id = $1', [userId]);
        console.log('Profile after revert:', profileRes3.rows[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

testUpdate();
