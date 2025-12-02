'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditProgramPage() {
    const params = useParams()
    const programId = params.id as string
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

    // Fetch existing program data
    const { data: programData, isLoading: isProgramLoading } = useQuery({
        queryKey: ['program', programId],
        queryFn: async () => {
            const { data: program, error: programError } = await supabase
                .from('programs')
                .select('*')
                .eq('id', programId)
                .single()

            if (programError) throw programError

            const { data: daysData, error: daysError } = await supabase
                .from('program_days')
                .select(`
          id, name, order,
          exercises:program_exercises(
            exercise_id, sets, reps, order
          )
        `)
                .eq('program_id', programId)
                .order('order')

            if (daysError) throw daysError

            return { program, days: daysData }
        }
    })

    useEffect(() => {
        if (programData) {
            setName(programData.program.name)
            setDescription(programData.program.description || '')

            // Map existing days to the state structure
            const newDays = WEEKDAYS.map(dayName => {
                const existingDay = programData.days.find((d: any) => d.name === dayName)
                if (existingDay) {
                    return {
                        name: dayName,
                        exercises: existingDay.exercises
                            .sort((a: any, b: any) => a.order - b.order)
                            .map((ex: any) => ({
                                exercise_id: ex.exercise_id,
                                sets: ex.sets,
                                reps: ex.reps
                            }))
                    }
                }
                return { name: dayName, exercises: [] }
            })
            setDays(newDays)
        }
    }, [programData])

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
            // 1. Update Program
            const { error: programError } = await supabase
                .from('programs')
                .update({ name, description })
                .eq('id', programId)

            if (programError) throw programError

            // 2. Update Days and Exercises
            // Strategy: Delete all days and re-insert (easiest for now to ensure consistency)
            // Or better: Delete all program_exercises for this program's days, then re-insert?
            // Actually, since days are fixed Mon-Sun, we can just update days or ensure they exist.
            // But re-creating structure is safest to avoid orphans.
            // Let's delete all days for this program and re-create.

            await supabase.from('program_days').delete().eq('program_id', programId)

            for (let i = 0; i < days.length; i++) {
                const day = days[i]
                const { data: dayData, error: dayError } = await supabase
                    .from('program_days')
                    .insert({ program_id: programId, name: day.name, order: i })
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
            console.error('Error updating program:', error)
            alert('Failed to update program')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isProgramLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
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
                    <h1 className="text-2xl font-bold tracking-tight">Edit Program</h1>
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
                    Update Program
                </Button>
            </div>
        </div>
    )
}
