'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Dumbbell, History } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

type CompletedWorkout = {
    id: string
    started_at: string
    ended_at: string
    program: {
        name: string
    } | null
}

export function WorkoutHistory() {
    const { user } = useAuth()
    const supabase = createClient()

    const { data: history, isLoading } = useQuery({
        queryKey: ['workoutHistory'],
        queryFn: async () => {
            if (!user) return []
            const { data, error } = await supabase
                .from('workouts')
                .select(`
                    id,
                    started_at,
                    ended_at,
                    program:programs(name)
                `)
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('ended_at', { ascending: false })
                .limit(10)

            if (error) throw error
            return data as unknown as CompletedWorkout[]
        },
        enabled: !!user
    })

    if (isLoading) {
        return <div className="text-center text-muted-foreground py-4">Loading history...</div>
    }

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No completed workouts yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent History
            </h2>
            <div className="space-y-3">
                {history.map((workout) => {
                    const date = new Date(workout.ended_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    })
                    const time = new Date(workout.ended_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    })

                    return (
                        <Card key={workout.id} className="overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-medium">{workout.program?.name || 'Freestyle Workout'}</h3>
                                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {date}
                                        </span>
                                        <span>•</span>
                                        <span>{time}</span>
                                    </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Dumbbell className="h-4 w-4 text-primary" />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
