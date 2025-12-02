import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Dumbbell, History, Loader2, Save, Edit2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type CompletedWorkout = {
    id: string
    started_at: string
    ended_at: string
    program: {
        name: string
    } | null
}

type WorkoutLog = {
    id: string
    workout_id: string
    exercise_id: string
    set_number: number
    reps: number
    weight: number
    exercise?: {
        name: string
    }
}

export function WorkoutHistory() {
    const { user } = useAuth()
    const supabase = createClient()
    const queryClient = useQueryClient()
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
    const [editedLogs, setEditedLogs] = useState<WorkoutLog[]>([])
    const [isEditing, setIsEditing] = useState(false)

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

    const { data: workoutDetails, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['workoutDetails', selectedWorkoutId],
        queryFn: async () => {
            if (!selectedWorkoutId) return null
            const { data, error } = await supabase
                .from('workout_logs')
                .select(`
                    *,
                    exercise:exercises(name)
                `)
                .eq('workout_id', selectedWorkoutId)
                .order('created_at', { ascending: true })

            if (error) throw error
            return data as WorkoutLog[]
        },
        enabled: !!selectedWorkoutId
    })

    useEffect(() => {
        if (workoutDetails) {
            setEditedLogs(JSON.parse(JSON.stringify(workoutDetails)))
        }
    }, [workoutDetails])

    const updateLog = (logId: string, field: 'reps' | 'weight', value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value)
        setEditedLogs(prev => prev.map(log =>
            log.id === logId ? { ...log, [field]: numValue } : log
        ))
    }

    const saveChangesMutation = useMutation({
        mutationFn: async () => {
            const updates = editedLogs.map(log => ({
                id: log.id,
                reps: log.reps,
                weight: log.weight
            }))

            const { error } = await supabase
                .from('workout_logs')
                .upsert(updates)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workoutDetails', selectedWorkoutId] })
            setIsEditing(false)
        }
    })

    // Group logs for display
    const groupedLogs = (isEditing ? editedLogs : workoutDetails || []).reduce((acc: any, log: any) => {
        const exerciseName = log.exercise?.name || 'Unknown Exercise'
        if (!acc[exerciseName]) {
            acc[exerciseName] = []
        }
        acc[exerciseName].push(log)
        return acc
    }, {})

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
                        <Card
                            key={workout.id}
                            className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
                            onClick={() => {
                                setSelectedWorkoutId(workout.id)
                                setIsEditing(false)
                            }}
                        >
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

            <Dialog open={!!selectedWorkoutId} onOpenChange={(open) => !open && setSelectedWorkoutId(null)}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>Workout Details</span>
                            {!isEditing && (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                                </Button>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoadingDetails ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : workoutDetails ? (
                        <div className="space-y-6">
                            {Object.entries(groupedLogs).map(([exerciseName, logs]: [string, any]) => (
                                <div key={exerciseName} className="space-y-2">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{exerciseName}</h3>
                                    <div className="grid grid-cols-[40px_1fr_1fr] gap-2 text-sm">
                                        <div className="font-medium text-xs text-muted-foreground text-center">SET</div>
                                        <div className="font-medium text-xs text-muted-foreground text-center">REPS</div>
                                        <div className="font-medium text-xs text-muted-foreground text-center">KG</div>
                                        {logs.map((log: any, index: number) => (
                                            <div key={log.id} className="contents items-center">
                                                <div className="font-mono flex items-center justify-center bg-muted rounded h-8 w-8 mx-auto">{index + 1}</div>
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={log.reps}
                                                        onChange={(e) => updateLog(log.id, 'reps', e.target.value)}
                                                        className="h-8 text-center"
                                                    />
                                                ) : (
                                                    <div className="font-mono flex items-center justify-center h-8">{log.reps}</div>
                                                )}
                                                {isEditing ? (
                                                    <Input
                                                        type="number"
                                                        value={log.weight}
                                                        onChange={(e) => updateLog(log.id, 'weight', e.target.value)}
                                                        className="h-8 text-center"
                                                    />
                                                ) : (
                                                    <div className="font-mono flex items-center justify-center h-8">{log.weight}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(groupedLogs).length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No exercises recorded for this workout.</p>
                            )}
                        </div>
                    ) : null}

                    {isEditing && (
                        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                            <div className="flex gap-2 w-full">
                                <Button variant="outline" className="flex-1" onClick={() => {
                                    setIsEditing(false)
                                    setEditedLogs(JSON.parse(JSON.stringify(workoutDetails)))
                                }}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={() => saveChangesMutation.mutate()} disabled={saveChangesMutation.isPending}>
                                    {saveChangesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
