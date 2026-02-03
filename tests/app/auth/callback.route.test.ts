import { describe, expect, it, vi, beforeEach } from 'vitest'

const exchangeCodeForSession = vi.fn()
const createServerSupabaseClient = vi.fn(() => ({
    auth: {
        exchangeCodeForSession
    }
}))

vi.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient
}))

describe('GET /auth/callback', () => {
    beforeEach(() => {
        exchangeCodeForSession.mockReset()
        createServerSupabaseClient.mockClear()
        process.env.NODE_ENV = 'development'
    })

    it('redirects to auth-code-error when code is missing', async () => {
        const { GET } = await import('@/app/auth/callback/route')
        const request = new Request('https://example.com/auth/callback')

        const response = await GET(request)
        expect(response.headers.get('location')).toBe('https://example.com/auth/auth-code-error')
    })

    it('redirects to next url on success in development', async () => {
        exchangeCodeForSession.mockResolvedValue({ error: null })
        const { GET } = await import('@/app/auth/callback/route')
        const request = new Request('https://example.com/auth/callback?code=abc&next=/dashboard')

        const response = await GET(request)
        expect(response.headers.get('location')).toBe('https://example.com/dashboard')
    })

    it('uses forwarded host in production', async () => {
        process.env.NODE_ENV = 'production'
        exchangeCodeForSession.mockResolvedValue({ error: null })
        const { GET } = await import('@/app/auth/callback/route')
        const request = new Request('https://example.com/auth/callback?code=abc', {
            headers: {
                'x-forwarded-host': 'forwarded.example.com'
            }
        })

        const response = await GET(request)
        expect(response.headers.get('location')).toBe('https://forwarded.example.com/')
    })
})
