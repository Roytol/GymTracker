'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Check, Loader2, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type WorkoutLog = {
    id?: string
    exercise_id: string
    set_number: number
    reps: number | null
    weight: number | null
}

type Exercise = {
    id: string
    name: string
}

type ProgramDay = {
    id: string
    name: string
}

export default function ActiveWorkoutPage() {
    const params = useParams()
    const workoutId = params.id as string
    const router = useRouter()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
    const [logs, setLogs] = useState<WorkoutLog[]>([])
    const [activeExercises, setActiveExercises] = useState<Exercise[]>([])

    // Fetch Workout
    const { data: workout, isLoading: workoutLoading } = useQuery({
        queryKey: ['workout', workoutId],
        queryFn: async () => {
            const { data, error } = await supabase.from('workouts').select('*').eq('id', workoutId).single()
            if (error) throw error
            return data
        }
    })

    useEffect(() => {
        if (workout?.program_day_id) {
            setSelectedDayId(workout.program_day_id)
        }
    }, [workout])

    // Fetch Program Days if applicable
    const { data: programDays } = useQuery({
        queryKey: ['programDays', workout?.program_id],
        queryFn: async () => {
            if (!workout?.program_id) return []
            const { data, error } = await supabase.from('program_days').select('*').eq('program_id', workout.program_id).order('order')
            if (error) throw error
            return data as ProgramDay[]
        },
        enabled: !!workout?.program_id
    })

    // Fetch Exercises for selection
    const { data: allExercises } = useQuery({
        queryKey: ['exercises'],
        queryFn: async () => {
            const { data, error } = await supabase.from('exercises').select('id, name').order('name')
            if (error) throw error
            return data as Exercise[]
        }
    })

    // Fetch Previous Logs
    const { data: previousLogs } = useQuery({
        queryKey: ['previousLogs', activeExercises.map(e => e.id).join(',')],
        queryFn: async () => {
            if (activeExercises.length === 0) return []
            const { data, error } = await supabase
                .from('workout_logs')
                .select('exercise_id, weight, reps, created_at')
                .in('exercise_id', activeExercises.map(e => e.id))
                .order('created_at', { ascending: false })
                .limit(500)

            if (error) throw error
            return data
        },
        enabled: activeExercises.length > 0
    })

    const getLastLog = (exerciseId: string) => {
        if (!previousLogs) return null
        return previousLogs.find(l => l.exercise_id === exerciseId && l.weight && l.weight > 0)
    }



    // Load exercises when day is selected
    useEffect(() => {
        const loadDayExercises = async () => {
            if (!selectedDayId) return
            const { data, error } = await supabase
                .from('program_exercises')
                .select('exercise_id, exercises(id, name), sets, reps')
                .eq('day_id', selectedDayId)
                .order('order')

            if (error) {
                console.error(error)
                return
            }

            // @ts-ignore
            const exercises = data.map(item => Array.isArray(item.exercises) ? item.exercises[0] : item.exercises) as Exercise[]
            setActiveExercises(exercises)

            // Initialize logs
            const initialLogs: WorkoutLog[] = []
            data.forEach(item => {
                for (let i = 1; i <= (item.sets || 3); i++) {
                    initialLogs.push({
                        exercise_id: item.exercise_id,
                        set_number: i,
                        reps: null,
                        weight: null
                    })
                }
            })
            setLogs(initialLogs)
        }

        if (selectedDayId) {
            loadDayExercises()
        }
    }, [selectedDayId, supabase])

    // Warn on exit
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (activeExercises.length > 0 && logs.some(l => l.reps || l.weight)) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [activeExercises, logs])

    const addExercise = (exerciseId: string) => {
        const exercise = allExercises?.find(e => e.id === exerciseId)
        if (exercise) {
            setActiveExercises([...activeExercises, exercise])
            // Add 3 sets by default
            const newLogs = []
            for (let i = 1; i <= 3; i++) {
                newLogs.push({
                    exercise_id: exerciseId,
                    set_number: i,
                    reps: null,
                    weight: null
                })
            }
            setLogs([...logs, ...newLogs])
        }
    }

    const updateLog = (exerciseId: string, setNumber: number, field: 'reps' | 'weight', value: string) => {
        const numValue = value === '' ? null : parseFloat(value)
        setLogs(logs.map(log =>
            (log.exercise_id === exerciseId && log.set_number === setNumber)
                ? { ...log, [field]: numValue }
                : log
        ))
    }

    const finishWorkoutMutation = useMutation({
        mutationFn: async () => {
            console.log('[WorkoutSession] Finishing workout:', workoutId)
            // Save logs
            const { error: logsError } = await supabase.from('workout_logs').insert(
                logs.map(log => ({
                    workout_id: workoutId,
                    exercise_id: log.exercise_id,
                    set_number: log.set_number,
                    reps: log.reps || 0,
                    weight: log.weight || 0
                }))
            )
            if (logsError) throw logsError

            // Update workout status
            const { error: updateError } = await supabase
                .from('workouts')
                .update({ status: 'completed', ended_at: new Date().toISOString() })
                .eq('id', workoutId)

            if (updateError) throw updateError
        },
        onSuccess: () => {
            console.log('[WorkoutSession] Workout finished successfully')
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            toast.success("Workout completed! Great job!")
            router.push('/')
        },
        onError: (error) => {
            console.error('[WorkoutSession] Error finishing workout:', error)
            toast.error("Failed to finish workout")
        }
    })

    if (workoutLoading) return <LoadingSpinner />

    if (workout?.program_id && !selectedDayId) {
        return (
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-bold">Select Day</h1>
                    <p className="text-muted-foreground">Which day of the program is this?</p>
                </header>
                <div className="grid gap-4">
                    {programDays?.map(day => (
                        <Card key={day.id} className="cursor-pointer hover:bg-accent" onClick={() => setSelectedDayId(day.id)}>
                            <CardHeader>
                                <CardTitle>{day.name}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                    <Button variant="outline" onClick={() => setSelectedDayId('freestyle')}>
                        Freestyle (Skip Program Day)
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-24">
            <header className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold">Active Workout</h1>
                </div>
                <Button size="sm" onClick={() => finishWorkoutMutation.mutate()} disabled={finishWorkoutMutation.isPending}>
                    {finishWorkoutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Finish
                </Button>
            </header>

            <div className="space-y-6">
                {activeExercises.map((exercise, index) => (
                    <Card key={`${exercise.id}-${index}`}>
                        <CardHeader className="py-3 bg-muted/50 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base">{exercise.name}</CardTitle>
                            {getLastLog(exercise.id) && (
                                <span className="text-xs text-muted-foreground">
                                    Last: {getLastLog(exercise.id)?.weight}kg × {getLastLog(exercise.id)?.reps}
                                </span>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 p-2 text-xs font-medium text-muted-foreground text-center border-b">
                                <div>Set</div>
                                <div>kg</div>
                                <div>Reps</div>
                                <div></div>
                            </div>
                            {logs.filter(l => l.exercise_id === exercise.id).map((log, i) => (
                                <div key={i} className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 p-2 items-center">
                                    <div className="text-center font-medium bg-muted rounded-full w-6 h-6 flex items-center justify-center mx-auto text-xs">
                                        {i + 1}
                                    </div>
                                    <Input
                                        type="number"
                                        placeholder="-"
                                        className="h-8 text-center"
                                        value={log.weight || ''}
                                        onChange={(e) => updateLog(exercise.id, log.set_number, 'weight', e.target.value)}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="-"
                                        className="h-8 text-center"
                                        value={log.reps || ''}
                                        onChange={(e) => updateLog(exercise.id, log.set_number, 'reps', e.target.value)}
                                    />
                                    <div className="flex justify-center">
                                        {/* Checkbox or completion toggle could go here */}
                                    </div>
                                </div>
                            ))}
                            <div className="p-2">
                                <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => {
                                    const nextSet = logs.filter(l => l.exercise_id === exercise.id).length + 1
                                    setLogs([...logs, { exercise_id: exercise.id, set_number: nextSet, reps: null, weight: null }])
                                }}>
                                    <Plus className="mr-1 h-3 w-3" /> Add Set
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full py-8 border-dashed">
                            <Plus className="mr-2 h-4 w-4" /> Add Exercise
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Exercise</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
                            {allExercises?.map(ex => (
                                <Button key={ex.id} variant="ghost" className="justify-start" onClick={() => addExercise(ex.id)}>
                                    {ex.name}
                                </Button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
