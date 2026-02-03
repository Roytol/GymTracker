import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeeklyCalendar } from '@/components/WeeklyCalendar'

describe('WeeklyCalendar', () => {
    beforeAll(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
    })

    afterAll(() => {
        vi.useRealTimers()
    })

    it('renders 7 day labels', () => {
        render(<WeeklyCalendar weekStart="monday" />)
        const dayLabels = screen.getAllByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)
        expect(dayLabels.length).toBe(7)
    })

    it('renders a workout icon when scheduled', () => {
        render(
            <WeeklyCalendar
                weekStart="monday"
                schedule={[{ dayName: 'Mon', dayOrder: 0, hasWorkout: true }]}
            />
        )
        const icons = document.querySelectorAll('svg')
        expect(icons.length).toBeGreaterThan(0)
    })
})
