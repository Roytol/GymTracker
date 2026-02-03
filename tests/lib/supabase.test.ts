import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockCreateBrowserClient = vi.fn(() => ({ mock: true }))

vi.mock('@supabase/ssr', () => ({
    createBrowserClient: mockCreateBrowserClient
}))

describe('supabase browser client', () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
        vi.resetModules()
        mockCreateBrowserClient.mockClear()
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    it('throws when env vars are missing', async () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        await expect(import('@/lib/supabase')).rejects.toThrow(
            'Missing Supabase env vars'
        )
    })

    it('creates a browser client with expected options', async () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
        process.env.NODE_ENV = 'production'

        const { createClient } = await import('@/lib/supabase')
        const client = createClient()

        expect(client).toEqual({ mock: true })
        expect(mockCreateBrowserClient).toHaveBeenCalledWith(
            'https://example.supabase.co',
            'anon-key',
            expect.objectContaining({
                auth: expect.objectContaining({
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }),
                cookieOptions: expect.objectContaining({
                    maxAge: 60 * 60 * 24 * 365,
                    sameSite: 'lax',
                    secure: true
                })
            })
        )
    })
})
