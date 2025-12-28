import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // Optional: Protect with a secret if desired, though not strictly required for a harmless ping
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // If CRON_SECRET is not set, we might allow it or fail. 
        // For simplicity in this user's context (personal portfolio), we'll allow it if env var is missing,
        // but if it IS set, we check it.
        if (process.env.CRON_SECRET) {
            return new NextResponse('Unauthorized', { status: 401 })
        }
    }

    const supabase = await createClient()

    // Perform a simple query to generate activity
    // We select count of profiles. Even if RLS blocks it or returns 0, it hits the API.
    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Keep-alive ping error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count })
}
