import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = 'https://ljsvhaooszjmscqkphit.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqc3ZoYW9vc3pqbXNjcWtwaGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODU3NzYsImV4cCI6MjA4MDI2MTc3Nn0.Xb3nmW_Bd6571lcJbX5FGZYucg7kiUymUJG3IHeikZI'

export const createClient = () =>
    createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
        cookieOptions: {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        },
    })
