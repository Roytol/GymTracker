
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup(email, password) {
    console.log(`Attempting signup for: '${email}'`);
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error(`Error for ${email}:`, error.message);
        console.error('Full error:', error);
    } else {
        console.log(`Success for ${email}:`, data);
    }
}

async function run() {
    // Test domain hypothesis
    await testSignup('rom@example.com', 'password123');

    // Test length hypothesis (5 chars)
    await testSignup('abcde@gmail.com', 'password123');

    // Test length hypothesis (6 chars)
    await testSignup('abcdef@gmail.com', 'password123');

    // Test "common name" hypothesis
    await testSignup('admin@gmail.com', 'password123');
}

run();
