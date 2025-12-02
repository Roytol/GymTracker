'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp } from 'lucide-react'

type Exercise = {
    id: string
    name: string
}

type WorkoutLog = {
    weight: number
    reps: number
    created_at: string
}

export default function ProgressPage() {
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
    const supabase = createClient()

    // Fetch exercises for selection
    const { data: exercises, isLoading: exercisesLoading } = useQuery({
        queryKey: ['exercises'],
        queryFn: async () => {
            const { data, error } = await supabase.from('exercises').select('id, name').order('name')
            if (error) throw error
            return data as Exercise[]
        }
    })

    // Fetch logs for selected exercise
    const { data: logs, isLoading: logsLoading } = useQuery({
        queryKey: ['exerciseLogs', selectedExerciseId],
        queryFn: async () => {
            if (!selectedExerciseId) return []
            const { data, error } = await supabase
                .from('workout_logs')
                .select('weight, reps, created_at')
                .eq('exercise_id', selectedExerciseId)
                .order('created_at', { ascending: true })
                .not('weight', 'is', null)
                .not('reps', 'is', null)

            if (error) throw error
            return data as WorkoutLog[]
        },
        enabled: !!selectedExerciseId
    })

    // Calculate 1RM Data
    const chartData = useMemo(() => {
        if (!logs) return []
        return logs.map(log => {
            // Epley Formula: 1RM = Weight * (1 + Reps/30)
            const oneRepMax = log.weight * (1 + log.reps / 30)
            return {
                date: new Date(log.created_at).toLocaleDateString(),
                oneRepMax: Math.round(oneRepMax),
                weight: log.weight,
                reps: log.reps
            }
        })
    }, [logs])

    return (
        <div className="space-y-6 pb-24">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
                <p className="text-muted-foreground">Track your strength gains over time</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Exercise Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Exercise</label>
                        <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an exercise" />
                            </SelectTrigger>
                            <SelectContent>
                                {exercises?.map(ex => (
                                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-[300px] w-full">
                        {selectedExerciseId ? (
                            logsLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}kg`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                            labelStyle={{ color: '#9ca3af' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="oneRepMax"
                                            stroke="#2563eb"
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: "#2563eb" }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                    <TrendingUp className="h-8 w-8 opacity-50" />
                                    <p>No data available for this exercise yet.</p>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                <TrendingUp className="h-8 w-8 opacity-50" />
                                <p>Select an exercise to view progress</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
