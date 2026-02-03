import { describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const updateSession = vi.fn()

vi.mock('@/lib/supabase-middleware', () => ({
    updateSession
}))

describe('proxy', () => {
    it('delegates to updateSession', async () => {
        updateSession.mockResolvedValue({ ok: true })
        const { proxy } = await import('@/proxy')
        const request = { url: 'https://example.com' } as NextRequest
        const result = await proxy(request)
        expect(result).toEqual({ ok: true })
        expect(updateSession).toHaveBeenCalledWith(request)
    })
})
