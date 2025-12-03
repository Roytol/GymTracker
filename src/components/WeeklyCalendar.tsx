'use client'

import { cn } from "@/lib/utils"
import { Dumbbell, Moon } from "lucide-react"

type WeeklyCalendarProps = {
    schedule?: {
        dayName: string
        dayOrder: number
        hasWorkout: boolean
    }[]
    weekStart?: 'monday' | 'sunday'
}

export function WeeklyCalendar({ schedule, weekStart = 'monday' }: WeeklyCalendarProps) {
    const today = new Date()

    // Adjust current day index based on week start
    // If Monday start: Mon=0, Sun=6. (today.getDay() + 6) % 7
    // If Sunday start: Sun=0, Sat=6. today.getDay()
    const currentDayIndex = weekStart === 'monday'
        ? (today.getDay() + 6) % 7
        : today.getDay()

    // Generate dates for the current week
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDayIndex)

    const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)

        // Determine day name based on date
        const shortDayName = date.toLocaleDateString('en-US', { weekday: 'short' })

        // Calculate the corresponding database day index (Monday=0)
        // If weekStart is 'monday', i maps 1:1 (0=Mon, ..., 6=Sun)
        // If weekStart is 'sunday', i=0 is Sun (DB=6), i=1 is Mon (DB=0)
        const dbDayIndex = weekStart === 'monday'
            ? i
            : (i + 6) % 7

        const hasWorkout = schedule?.find(s => s.dayOrder === dbDayIndex)?.hasWorkout

        return {
            day: shortDayName,
            date: date.getDate(),
            isToday: i === currentDayIndex,
            hasWorkout
        }
    })

    return (
        <div className="flex justify-between items-center bg-card rounded-xl p-4 border shadow-sm">
            {weekDates.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">{item.day}</span>
                    <div className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                        item.isToday
                            ? "bg-primary text-primary-foreground shadow-xl scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "text-foreground hover:bg-muted"
                    )}>
                        {item.date}
                    </div>
                    <div className="h-4 flex items-center justify-center">
                        {item.hasWorkout ? (
                            <Dumbbell className="h-3.5 w-3.5 text-primary" />
                        ) : (
                            <Moon className="h-3 w-3 text-muted-foreground/40" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
