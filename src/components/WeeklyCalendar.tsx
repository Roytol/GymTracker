'use client'

import { cn } from "@/lib/utils"
import { Dumbbell, Moon } from "lucide-react"

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type WeeklyCalendarProps = {
    schedule?: {
        dayName: string
        hasWorkout: boolean
    }[]
}

export function WeeklyCalendar({ schedule }: WeeklyCalendarProps) {
    const today = new Date()
    const currentDayIndex = (today.getDay() + 6) % 7 // Shift so Monday is 0, Sunday is 6

    // Generate dates for the current week (starting Monday)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDayIndex)

    const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)

        const dayName = FULL_WEEKDAYS[i]
        const hasWorkout = schedule?.find(s => s.dayName === dayName)?.hasWorkout

        return {
            day: WEEKDAYS[i],
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
