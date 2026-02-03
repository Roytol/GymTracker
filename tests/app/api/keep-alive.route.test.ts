import { describe, expect, it, vi, beforeEach } from 'vitest'

const selectMock = vi.fn()
const eqMock = vi.fn()
const gteMock = vi.fn()
const lteMock = vi.fn()

const fromMock = vi.fn(() => ({
    select: selectMock.mockReturnThis(),
    eq: eqMock.mockReturnThis(),
    gte: gteMock.mockReturnThis(),
    lte: lteMock.mockReturnThis()
}))

const createServerSupabaseClient = vi.fn(() => ({
    from: fromMock
}))

vi.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient
}))

describe('GET /api/keep-alive', () => {
    beforeEach(() => {
        fromMock.mockClear()
        selectMock.mockClear()
        eqMock.mockClear()
        gteMock.mockClear()
        lteMock.mockClear()
        createServerSupabaseClient.mockClear()
        process.env.CRON_SECRET = ''
    })

    it('returns 401 when CRON_SECRET is set and header is missing', async () => {
        process.env.CRON_SECRET = 'secret'
        const { GET } = await import('@/app/api/keep-alive/route')
        const request = new Request('https://example.com/api/keep-alive')

        const response = await GET(request)
        expect(response.status).toBe(401)
        const body = await response.text()
        expect(body).toBe('Unauthorized')
    })

    it('returns success json when query succeeds', async () => {
        selectMock.mockResolvedValue({ count: 3, error: null })
        const { GET } = await import('@/app/api/keep-alive/route')
        const request = new Request('https://example.com/api/keep-alive', {
            headers: { authorization: 'Bearer token' }
        })

        const response = await GET(request)
        expect(response.status).toBe(200)
        const json = await response.json()
        expect(json).toEqual({ success: true, count: 3 })
    })

    it('returns error json when query fails', async () => {
        selectMock.mockResolvedValue({ count: null, error: { message: 'boom' } })
        const { GET } = await import('@/app/api/keep-alive/route')
        const request = new Request('https://example.com/api/keep-alive')

        const response = await GET(request)
        expect(response.status).toBe(500)
        const json = await response.json()
        expect(json).toEqual({ success: false, error: 'boom' })
    })
})
