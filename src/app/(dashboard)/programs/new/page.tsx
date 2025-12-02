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
import { toast } from 'sonner'

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
    const [step, setStep] = useState<'template' | 'builder'>('template')
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

    const applyTemplate = (type: 'empty' | 'ppl' | 'ul' | 'fb' | 'pp') => {
        let newDays: ProgramDay[] = WEEKDAYS.map(day => ({ name: day, exercises: [] }))
        let newName = ''
        let newDesc = ''

        // Helper to find exercise ID by name (case-insensitive partial match)
        const findEx = (name: string) => {
            if (!exercises) return ''
            const found = exercises.find(e => e.name.toLowerCase().includes(name.toLowerCase()))
            return found ? found.id : ''
        }

        // Helper to create exercise object
        const createEx = (name: string, sets: number = 3, reps: string = '10') => ({
            exercise_id: findEx(name),
            sets,
            reps
        })

        switch (type) {
            case 'ppl':
                newName = 'Push Pull Legs'
                newDesc = '6-day split focusing on pushing, pulling, and leg movements.'
                // Mon=Push, Tue=Pull, Wed=Legs, Thu=Push, Fri=Pull, Sat=Legs
                newDays[0].name = 'Push A'
                newDays[0].exercises = [
                    createEx('Bench Press'),
                    createEx('Overhead Press'),
                    createEx('Incline Dumbbell Press'),
                    createEx('Tricep Pushdown')
                ]
                newDays[1].name = 'Pull A'
                newDays[1].exercises = [
                    createEx('Deadlift'),
                    createEx('Pull Up'),
                    createEx('Barbell Row'),
                    createEx('Bicep Curl')
                ]
                newDays[2].name = 'Legs A'
                newDays[2].exercises = [
                    createEx('Squat'),
                    createEx('Leg Press'),
                    createEx('Leg Extension'),
                    createEx('Calf Raise')
                ]
                newDays[3].name = 'Push B'
                newDays[3].exercises = [
                    createEx('Overhead Press'),
                    createEx('Bench Press'),
                    createEx('Lateral Raise'),
                    createEx('Skullcrusher')
                ]
                newDays[4].name = 'Pull B'
                newDays[4].exercises = [
                    createEx('Barbell Row'),
                    createEx('Lat Pulldown'),
                    createEx('Face Pull'),
                    createEx('Hammer Curl')
                ]
                newDays[5].name = 'Legs B'
                newDays[5].exercises = [
                    createEx('Deadlift'),
                    createEx('Lunge'),
                    createEx('Leg Curl'),
                    createEx('Calf Raise')
                ]
                newDays[6].name = 'Rest'
                break
            case 'ul':
                newName = 'Upper Lower'
                newDesc = '4-day split dividing training into upper and lower body sessions.'
                // Mon=Upper, Tue=Lower, Thu=Upper, Fri=Lower
                newDays[0].name = 'Upper A'
                newDays[0].exercises = [
                    createEx('Bench Press'),
                    createEx('Barbell Row'),
                    createEx('Overhead Press'),
                    createEx('Lat Pulldown')
                ]
                newDays[1].name = 'Lower A'
                newDays[1].exercises = [
                    createEx('Squat'),
                    createEx('Deadlift'),
                    createEx('Leg Extension'),
                    createEx('Leg Curl')
                ]
                newDays[2].name = 'Rest'
                newDays[3].name = 'Upper B'
                newDays[3].exercises = [
                    createEx('Incline Dumbbell Press'),
                    createEx('Pull Up'),
                    createEx('Lateral Raise'),
                    createEx('Bicep Curl')
                ]
                newDays[4].name = 'Lower B'
                newDays[4].exercises = [
                    createEx('Leg Press'),
                    createEx('Lunge'),
                    createEx('Calf Raise'),
                    createEx('Plank')
                ]
                newDays[5].name = 'Rest'
                newDays[6].name = 'Rest'
                break
            case 'fb':
                newName = 'Full Body'
                newDesc = '3-day split working the entire body each session.'
                // Mon, Wed, Fri
                newDays[0].name = 'Full Body A'
                newDays[0].exercises = [
                    createEx('Squat'),
                    createEx('Bench Press'),
                    createEx('Barbell Row')
                ]
                newDays[1].name = 'Rest'
                newDays[2].name = 'Full Body B'
                newDays[2].exercises = [
                    createEx('Deadlift'),
                    createEx('Overhead Press'),
                    createEx('Pull Up')
                ]
                newDays[3].name = 'Rest'
                newDays[4].name = 'Full Body C'
                newDays[4].exercises = [
                    createEx('Lunge'),
                    createEx('Dips'),
                    createEx('Chin Up')
                ]
                newDays[5].name = 'Rest'
                newDays[6].name = 'Rest'
                break
            case 'pp':
                newName = 'Push Pull'
                newDesc = '4-day split focusing on upper body push and pull movements.'
                // Mon=Push, Tue=Pull, Thu=Push, Fri=Pull
                newDays[0].name = 'Push A'
                newDays[0].exercises = [
                    createEx('Bench Press'),
                    createEx('Overhead Press'),
                    createEx('Incline Dumbbell Press'),
                    createEx('Tricep Pushdown')
                ]
                newDays[1].name = 'Pull A'
                newDays[1].exercises = [
                    createEx('Barbell Row'),
                    createEx('Lat Pulldown'),
                    createEx('Face Pull'),
                    createEx('Bicep Curl')
                ]
                newDays[2].name = 'Rest'
                newDays[3].name = 'Push B'
                newDays[3].exercises = [
                    createEx('Overhead Press'),
                    createEx('Dips'),
                    createEx('Lateral Raise'),
                    createEx('Skullcrusher')
                ]
                newDays[4].name = 'Pull B'
                newDays[4].exercises = [
                    createEx('Pull Up'),
                    createEx('Seated Row'),
                    createEx('Hammer Curl'),
                    createEx('Shrugs')
                ]
                newDays[5].name = 'Rest'
                newDays[6].name = 'Rest'
                break
            case 'empty':
            default:
                newName = ''
                newDesc = ''
                break
        }

        setName(newName)
        setDescription(newDesc)
        setDays(newDays)
        setStep('builder')
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
                    const exercisesToInsert = day.exercises
                        .filter(ex => ex.exercise_id && ex.exercise_id.trim() !== '')
                        .map((ex, idx) => ({
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

            toast.success("Program created successfully!")
            router.push('/programs')
        } catch (error) {
            console.error('Error saving program:', error)
            toast.error('Failed to save program')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => step === 'builder' ? setStep('template') : router.push('/programs')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {step === 'template' ? 'Choose Template' : 'New Program'}
                    </h1>
                </div>
            </header>

            {step === 'template' ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-[1.02] active:scale-95" onClick={() => applyTemplate('ppl')}>
                        <CardHeader>
                            <CardTitle>Push Pull Legs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">6 days/week. High frequency, great for hypertrophy.</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-[1.02] active:scale-95" onClick={() => applyTemplate('ul')}>
                        <CardHeader>
                            <CardTitle>Upper Lower</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">4 days/week. Balanced approach for strength and size.</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-[1.02] active:scale-95" onClick={() => applyTemplate('fb')}>
                        <CardHeader>
                            <CardTitle>Full Body</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">3 days/week. Efficient for beginners or busy schedules.</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-[1.02] active:scale-95" onClick={() => applyTemplate('pp')}>
                        <CardHeader>
                            <CardTitle>Push Pull</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">4 days/week. Upper body focus, no dedicated leg days.</p>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:scale-[1.02] active:scale-95 border-dashed" onClick={() => applyTemplate('empty')}>
                        <CardHeader>
                            <CardTitle>Start from Scratch</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">Build your own custom schedule from the ground up.</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <>
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
                </>
            )}
        </div>
    )
}

