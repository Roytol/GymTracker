import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockCreateServerClient = vi.fn(() => ({ mock: true }))

vi.mock('@supabase/ssr', () => ({
    createServerClient: mockCreateServerClient
}))

const cookieStore = {
    getAll: vi.fn(() => [{ name: 'session', value: 'abc' }]),
    set: vi.fn()
}

vi.mock('next/headers', () => ({
    cookies: () => cookieStore
}))

describe('supabase server client', () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
        vi.resetModules()
        mockCreateServerClient.mockClear()
        cookieStore.getAll.mockClear()
        cookieStore.set.mockClear()
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = { ...originalEnv }
    })

    it('throws when env vars are missing', async () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        await expect(import('@/lib/supabase-server')).rejects.toThrow(
            'Missing Supabase env vars'
        )
    })

    it('creates a server client with cookie helpers', async () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
        process.env.NODE_ENV = 'development'

        const { createServerSupabaseClient } = await import('@/lib/supabase-server')
        const client = createServerSupabaseClient()

        expect(client).toEqual({ mock: true })
        expect(mockCreateServerClient).toHaveBeenCalledWith(
            'https://example.supabase.co',
            'anon-key',
            expect.objectContaining({
                cookies: expect.objectContaining({
                    getAll: expect.any(Function),
                    setAll: expect.any(Function)
                }),
                cookieOptions: expect.objectContaining({
                    maxAge: 60 * 60 * 24 * 365,
                    sameSite: 'lax',
                    secure: false
                })
            })
        )
    })
})
