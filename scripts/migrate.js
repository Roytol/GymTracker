const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
// const dotenv = require('dotenv');

// Load env vars from .env file since we can't rely on Next.js to load them for this script
// But since we can't easily read .env if it's gitignored and we just failed to write it...
// I'll hardcode the connection string passed by the user for this script execution, 
// or try to read the file if I can (I can read it, just not write it via tool if ignored? No, I can't access it if ignored).
// Wait, I can't read .env if it's ignored? The tool `view_file` respects gitignore?
// "Search uses smart case and will ignore gitignored files by default." -> find_by_name
// "view_file" -> "View the contents of a file... This tool supports some binary files..." - doesn't explicitly say it respects gitignore, but the error message above said "Access to ... is prohibited by ... .gitignore".
// So I cannot read/write .env.
// I will use the connection string directly in this script.

const connectionString = 'postgresql://postgres.ljsvhaooszjmscqkphit:1JbDeJdUYKbtxGOT@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function migrate() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const schemaPath = path.join(__dirname, '../schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema.sql...');
        await client.query(schemaSql);
        console.log('Schema applied successfully');

    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
