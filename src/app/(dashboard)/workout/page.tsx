'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Play, Loader2, Dumbbell, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'

import { WorkoutHistory } from '@/components/WorkoutHistory'

type Program = {
    id: string
    name: string
}

type ProgramDay = {
    id: string
    name: string
    exercises: any[]
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function WorkoutPage() {
    const router = useRouter()
    const { user } = useAuth()
    const supabase = createClient()
    const today = new Date()
    const currentDayIndex = (today.getDay() + 6) % 7 // Mon=0, Sun=6
    const currentDayName = WEEKDAYS[currentDayIndex]

    // Fetch all programs
    const { data: programs, isLoading: isLoadingPrograms } = useQuery({
        queryKey: ['programs'],
        queryFn: async () => {
            if (!user) return []
            const { data, error } = await supabase.from('programs').select('id, name').eq('user_id', user.id)
            if (error) throw error
            return data as Program[]
        },
        enabled: !!user
    })

    // Fetch active program
    const { data: activeProgram } = useQuery({
        queryKey: ['activeProgram'],
        queryFn: async () => {
            if (!user) return null
            const { data, error } = await supabase
                .from('programs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data as Program | null
        },
        enabled: !!user
    })

    // Fetch today's workout
    const { data: todaysWorkout, isLoading: isLoadingToday } = useQuery({
        queryKey: ['todaysWorkout', activeProgram?.id, currentDayName],
        queryFn: async () => {
            if (!activeProgram) return null
            const { data, error } = await supabase
                .from('program_days')
                .select('*, exercises:program_exercises(*)')
                .eq('program_id', activeProgram.id)
                .eq('"order"', currentDayIndex)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data as ProgramDay | null
        },
        enabled: !!activeProgram
    })

    // Check if today's workout is already completed
    const { data: isWorkoutCompleted } = useQuery({
        queryKey: ['isWorkoutCompleted', user?.id],
        queryFn: async () => {
            if (!user) return false
            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date()
            endOfDay.setHours(23, 59, 59, 999)

            const { count } = await supabase
                .from('workouts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .gte('ended_at', startOfDay.toISOString())
                .lte('ended_at', endOfDay.toISOString())

            return count ? count > 0 : false
        },
        enabled: !!user
    })

    const startWorkoutMutation = useMutation({
        mutationFn: async ({ programId, programDayId }: { programId?: string, programDayId?: string }) => {
            if (!user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    program_id: programId || null,
                    program_day_id: programDayId || null,
                    status: 'in_progress'
                })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            router.push(`/workout/${data.id}`)
        }
    })

    const isLoading = isLoadingPrograms || isLoadingToday

    return (
        <div className="space-y-8 pb-24">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Workout</h1>
                <p className="text-muted-foreground">Let&apos;s crush it today!</p>
            </header>

            {/* Auto-Start Section */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Today&apos;s Session</h2>
                {isLoading ? (
                    <LoadingSpinner />
                ) : activeProgram && todaysWorkout && todaysWorkout.exercises.length > 0 ? (
                    <Card className="bg-primary text-primary-foreground border-none shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <CardHeader>
                            <CardTitle className="text-2xl">{todaysWorkout.name}</CardTitle>
                            <CardDescription className="text-primary-foreground/80 text-base">
                                {activeProgram.name} • {todaysWorkout.exercises.length} Exercises
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isWorkoutCompleted ? (
                                <Button
                                    className="w-full font-bold h-14 text-lg bg-white/20 text-white cursor-default hover:bg-white/20"
                                    disabled
                                >
                                    <CheckCircle2 className="mr-2 h-6 w-6" /> Session Completed
                                </Button>
                            ) : (
                                <Button
                                    className="w-full font-bold h-14 text-lg bg-white text-black hover:bg-white/90 shadow-md transition-all hover:scale-[1.02] active:scale-95"
                                    onClick={() => startWorkoutMutation.mutate({ programId: activeProgram.id, programDayId: todaysWorkout.id })}
                                    disabled={startWorkoutMutation.isPending}
                                >
                                    {startWorkoutMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                                    Start {todaysWorkout.name}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Dumbbell className="h-10 w-10 mb-2 opacity-20" />
                            <p>No specific workout scheduled for today.</p>
                            <p className="text-sm">Choose a program below to start.</p>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Other Programs */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Start Other Program</h2>
                <div className="grid gap-3">
                    {programs?.map((program) => (
                        <Card
                            key={program.id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
                            onClick={() => startWorkoutMutation.mutate({ programId: program.id })}
                        >
                            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base font-medium">{program.name}</CardTitle>
                                <Play className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    ))}
                    {programs?.length === 0 && (
                        <p className="text-muted-foreground text-sm">No programs found.</p>
                    )}
                </div>
            </section>

            {/* History */}
            <WorkoutHistory />
        </div>
    )
}
