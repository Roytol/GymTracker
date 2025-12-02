const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ljsvhaooszjmscqkphit:1JbDeJdUYKbtxGOT@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

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
