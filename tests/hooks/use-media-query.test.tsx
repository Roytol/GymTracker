import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from '@/hooks/use-media-query'

type Listener = (event: MediaQueryListEvent) => void

class MockMediaQueryList {
    matches: boolean
    media: string
    listeners: Set<Listener>

    constructor(media: string, matches: boolean) {
        this.media = media
        this.matches = matches
        this.listeners = new Set()
    }

    addEventListener(_type: 'change', listener: Listener) {
        this.listeners.add(listener)
    }

    removeEventListener(_type: 'change', listener: Listener) {
        this.listeners.delete(listener)
    }

    dispatch(matches: boolean) {
        this.matches = matches
        const event = { matches } as MediaQueryListEvent
        this.listeners.forEach((listener) => listener(event))
    }
}

describe('useMediaQuery', () => {
    let mql: MockMediaQueryList

    beforeEach(() => {
        mql = new MockMediaQueryList('(min-width: 600px)', false)
        vi.stubGlobal('matchMedia', vi.fn(() => mql))
    })

    it('returns initial match state', () => {
        const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'))
        expect(result.current).toBe(false)
    })

    it('updates when the media query changes', () => {
        const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'))
        act(() => {
            mql.dispatch(true)
        })
        expect(result.current).toBe(true)
    })
})
