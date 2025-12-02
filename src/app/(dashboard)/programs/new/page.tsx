'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Save, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

type Exercise = {
    id: string
    name: string
}

type ProgramExercise = {
    exercise_id: string
    sets: number
    reps: string
}

type ProgramDay = {
    name: string
    exercises: ProgramExercise[]
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function NewProgramPage() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [days, setDays] = useState<ProgramDay[]>(
        WEEKDAYS.map(day => ({ name: day, exercises: [] }))
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    const router = useRouter()
    const { user } = useAuth()
    const supabase = createClient()

    const { data: exercises } = useQuery({
        queryKey: ['exercises'],
        queryFn: async () => {
            const { data, error } = await supabase.from('exercises').select('id, name').order('name')
            if (error) throw error
            return data as Exercise[]
        }
    })

    const addExerciseToDay = (dayIndex: number) => {
        const newDays = [...days]
        newDays[dayIndex].exercises.push({ exercise_id: '', sets: 3, reps: '10' })
        setDays(newDays)
    }

    const removeExerciseFromDay = (dayIndex: number, exerciseIndex: number) => {
        const newDays = [...days]
        newDays[dayIndex].exercises = newDays[dayIndex].exercises.filter((_, i) => i !== exerciseIndex)
        setDays(newDays)
    }

    const updateExercise = (dayIndex: number, exerciseIndex: number, field: keyof ProgramExercise, value: any) => {
        const newDays = [...days]
        newDays[dayIndex].exercises[exerciseIndex] = { ...newDays[dayIndex].exercises[exerciseIndex], [field]: value }
        setDays(newDays)
    }

    const handleSubmit = async () => {
        if (!user || !name) return
        setIsSubmitting(true)

        try {
            // 1. Create Program
            const { data: program, error: programError } = await supabase
                .from('programs')
                .insert({ user_id: user.id, name, description })
                .select()
                .single()

            if (programError) throw programError

            // 2. Create Days and Exercises
            for (let i = 0; i < days.length; i++) {
                const day = days[i]
                // Only insert days that have exercises? Or all days? 
                // Let's insert all days to keep the structure consistent, or maybe just days with exercises.
                // For a weekly schedule, it's better to have all days implicitly or explicitly.
                // Let's insert all days so we can query by day name/order easily.

                const { data: dayData, error: dayError } = await supabase
                    .from('program_days')
                    .insert({ program_id: program.id, name: day.name, order: i })
                    .select()
                    .single()

                if (dayError) throw dayError

                if (day.exercises.length > 0) {
                    const exercisesToInsert = day.exercises.map((ex, idx) => ({
                        day_id: dayData.id,
                        exercise_id: ex.exercise_id,
                        sets: ex.sets,
                        reps: ex.reps,
                        order: idx
                    }))

                    const { error: exError } = await supabase
                        .from('program_exercises')
                        .insert(exercisesToInsert)

                    if (exError) throw exError
                }
            }

            router.push('/programs')
        } catch (error) {
            console.error('Error saving program:', error)
            alert('Failed to save program')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/programs">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Program</h1>
                </div>
            </header>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Program Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PPL Strength" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Goal: Hypertrophy..." />
                </div>
            </div>

            <div className="space-y-6">
                {days.map((day, dayIndex) => (
                    <Card key={dayIndex} className="relative">
                        <CardHeader className="pb-2 bg-muted/30">
                            <CardTitle className="text-lg">{day.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {day.exercises.map((ex, exIndex) => (
                                <div key={exIndex} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-2">
                                        <Select
                                            value={ex.exercise_id}
                                            onValueChange={(val) => updateExercise(dayIndex, exIndex, 'exercise_id', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Exercise" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {exercises?.map((e) => (
                                                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    type="number"
                                                    value={ex.sets}
                                                    onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', parseInt(e.target.value))}
                                                    placeholder="Sets"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    value={ex.reps}
                                                    onChange={(e) => updateExercise(dayIndex, exIndex, 'reps', e.target.value)}
                                                    placeholder="Reps"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeExerciseFromDay(dayIndex, exIndex)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addExerciseToDay(dayIndex)} className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Add Exercise
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="fixed bottom-20 right-4 left-4">
                <Button className="w-full shadow-lg" size="lg" onClick={handleSubmit} disabled={isSubmitting || !name}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Program
                </Button>
            </div>
        </div>
    )
}

