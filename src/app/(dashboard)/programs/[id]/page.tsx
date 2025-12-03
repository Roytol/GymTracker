'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type Program = {
    id: string
    name: string
    description: string | null
}

type ProgramDay = {
    id: string
    name: string
    order: number
    exercises: {
        id: string
        sets: number
        reps: string
        exercise: {
            name: string
        }
    }[]
}

export default function ProgramDetailsPage() {
    const params = useParams()
    const programId = params.id as string
    const router = useRouter()
    const supabase = createClient()

    const { data: program, isLoading: programLoading } = useQuery({
        queryKey: ['program', programId],
        queryFn: async () => {
            const { data, error } = await supabase.from('programs').select('*').eq('id', programId).single()
            if (error) throw error
            return data as Program
        }
    })

    const { data: days, isLoading: daysLoading } = useQuery({
        queryKey: ['programDays', programId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('program_days')
                .select(`
          id, name, order,
          exercises:program_exercises(
            id, sets, reps,
            exercise:exercises(name)
          )
        `)
                .eq('program_id', programId)
                .order('order')

            if (error) throw error

            // Transform data to match type
            return data?.map(day => ({
                ...day,
                exercises: day.exercises.map((ex: any) => ({
                    id: ex.id,
                    sets: ex.sets,
                    reps: ex.reps,
                    exercise: ex.exercise
                }))
            })) as ProgramDay[]
        }
    })

    if (programLoading || daysLoading) {
        return <LoadingSpinner />
    }

    if (!program) {
        return <div className="p-8 text-center">Program not found</div>
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
                    <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
                    {program.description && <p className="text-muted-foreground text-sm">{program.description}</p>}
                </div>
            </header>

            <div className="space-y-4">
                {days?.map((day) => (
                    <Card key={day.id}>
                        <CardHeader className="py-3 bg-muted/30">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {day.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {day.exercises.length > 0 ? (
                                <ul className="space-y-3">
                                    {day.exercises.map((ex) => (
                                        <li key={ex.id} className="flex justify-between items-center text-sm">
                                            <span className="font-medium">{ex.exercise.name}</span>
                                            <span className="text-muted-foreground">{ex.sets} x {ex.reps}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Rest Day</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
