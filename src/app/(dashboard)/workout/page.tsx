'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Play, Loader2, Dumbbell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type Program = {
    id: string
    name: string
}

export default function WorkoutPage() {
    const router = useRouter()
    const { user } = useAuth()
    const supabase = createClient()

    const { data: programs, isLoading } = useQuery({
        queryKey: ['programs'],
        queryFn: async () => {
            if (!user) return []
            const { data, error } = await supabase.from('programs').select('id, name').eq('user_id', user.id)
            if (error) throw error
            return data as Program[]
        },
        enabled: !!user
    })

    const startWorkoutMutation = useMutation({
        mutationFn: async (programId?: string) => {
            if (!user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    program_id: programId || null,
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

    return (
        <div className="space-y-6 pb-20">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Workout</h1>
                <p className="text-muted-foreground">Start a new session</p>
            </header>

            {/* Freestyle removed as per request */}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Start from Program</h2>
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {programs?.map((program) => (
                            <Card key={program.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => startWorkoutMutation.mutate(program.id)}>
                                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-base">{program.name}</CardTitle>
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                            </Card>
                        ))}
                        {programs?.length === 0 && (
                            <p className="text-muted-foreground text-sm">No programs found. Create one to get started!</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
