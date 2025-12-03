'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2, Trash2, Pencil, CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge'

type Program = {
    id: string
    name: string
    description: string | null
    created_at: string
    is_active: boolean
}

export default function ProgramsPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: programs, isLoading } = useQuery({
        queryKey: ['programs'],
        queryFn: async () => {
            if (!user) return []
            const { data, error } = await supabase
                .from('programs')
                .select('*')
                .eq('user_id', user.id)
                .order('is_active', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Program[]
        },
        enabled: !!user
    })

    const deleteProgramMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('programs').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] })
        }
    })

    const setActiveProgramMutation = useMutation({
        mutationFn: async (id: string) => {
            // 1. Set all to inactive
            await supabase.from('programs').update({ is_active: false }).eq('user_id', user!.id)
            // 2. Set target to active
            const { error } = await supabase.from('programs').update({ is_active: true }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] })
            queryClient.invalidateQueries({ queryKey: ['activeProgram'] }) // Invalidate Home page query
        }
    })

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
                    <p className="text-muted-foreground">Manage your workout routines</p>
                </div>
                <Button size="icon" asChild>
                    <Link href="/programs/new">
                        <Plus className="h-5 w-5" />
                    </Link>
                </Button>
            </header>

            <div className="space-y-4">
                {isLoading ? (
                    <LoadingSpinner />
                ) : programs?.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        No programs found. Create your first one!
                    </div>
                ) : (
                    programs?.map((program) => (
                        <Card key={program.id} className={cn(
                            "transition-all duration-300 hover:shadow-md hover:scale-[1.01] cursor-pointer group",
                            program.is_active ? "border-primary/50 shadow-sm" : "hover:border-primary/20"
                        )}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{program.name}</CardTitle>
                                            {program.is_active && <Badge className="text-xs bg-[var(--success)] text-[var(--success-foreground)] hover:bg-[var(--success)]/80 shadow-sm">Active</Badge>}
                                        </div>
                                        {program.description && <CardDescription>{program.description}</CardDescription>}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/programs/${program.id}/edit`}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Program?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the program
                                                        &quot;{program.name}&quot; and all its associated data.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteProgramMutation.mutate(program.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" asChild>
                                        <Link href={`/programs/${program.id}`}>View Details</Link>
                                    </Button>
                                    {!program.is_active && (
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => setActiveProgramMutation.mutate(program.id)}
                                            disabled={setActiveProgramMutation.isPending}
                                        >
                                            {setActiveProgramMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Active"}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
