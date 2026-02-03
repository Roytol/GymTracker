import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const authGetUser = vi.fn()
const mockCreateServerClient = vi.fn(() => ({
    auth: {
        getUser: authGetUser
    }
}))

const nextResponseNext = vi.fn((input?: any) => ({
    type: 'next',
    request: input?.request,
    cookies: {
        set: vi.fn()
    }
}))

const nextResponseRedirect = vi.fn((url: string) => ({
    type: 'redirect',
    url
}))

vi.mock('@supabase/ssr', () => ({
    createServerClient: mockCreateServerClient
}))

vi.mock('next/server', () => ({
    NextResponse: {
        next: nextResponseNext,
        redirect: nextResponseRedirect
    }
}))

function makeRequest(pathname: string): NextRequest {
    const url = new URL(`https://example.com${pathname}`)
    const cookies = {
        getAll: vi.fn(() => []),
        set: vi.fn()
    }
    return {
        cookies,
        nextUrl: {
            pathname,
            clone: () => new URL(url.toString())
        }
    } as unknown as NextRequest
}

describe('updateSession middleware', () => {
    beforeEach(() => {
        authGetUser.mockReset()
        nextResponseNext.mockClear()
        nextResponseRedirect.mockClear()
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    })

    it('redirects to /auth when user is missing', async () => {
        authGetUser.mockResolvedValue({ data: { user: null } })
        const { updateSession } = await import('@/lib/supabase-middleware')

        const response = await updateSession(makeRequest('/dashboard'))
        expect(response).toEqual({ type: 'redirect', url: 'https://example.com/auth' })
        expect(nextResponseRedirect).toHaveBeenCalled()
    })

    it('allows /auth routes without redirect', async () => {
        authGetUser.mockResolvedValue({ data: { user: null } })
        const { updateSession } = await import('@/lib/supabase-middleware')

        const response = await updateSession(makeRequest('/auth'))
        expect(response).toEqual(expect.objectContaining({ type: 'next' }))
    })

    it('passes through when user exists', async () => {
        authGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
        const { updateSession } = await import('@/lib/supabase-middleware')

        const response = await updateSession(makeRequest('/dashboard'))
        expect(response).toEqual(expect.objectContaining({ type: 'next' }))
    })
})
