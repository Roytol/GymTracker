import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

describe('LoadingSpinner', () => {
    it('renders a spinner svg with default size', () => {
        const { container } = render(<LoadingSpinner />)
        const svg = container.querySelector('svg')
        expect(svg).toBeTruthy()
        expect(svg?.getAttribute('width')).toBe('32')
        expect(svg?.getAttribute('height')).toBe('32')
    })
})
