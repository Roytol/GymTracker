'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select'
import { Plus, Search, Loader2, Trash2, Pencil, Dumbbell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { toast } from 'sonner'
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

type Exercise = {
    id: string
    name: string
    description: string | null
    category: string
    is_custom: boolean
    user_id: string | null
}

export default function ExercisesPage() {
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)

    const [newExercise, setNewExercise] = useState({ name: '', category: '', description: '' })

    const { user } = useAuth()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const { data: exercises, isLoading } = useQuery({
        queryKey: ['exercises'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('name')

            if (error) throw error
            return data as Exercise[]
        }
    })

    const addExerciseMutation = useMutation({
        mutationFn: async (exerciseData: { name: string; category: string; description: string }) => {
            console.log('[ExerciseManager] Adding custom exercise:', exerciseData.name)
            const { data, error } = await supabase
                .from('exercises')
                .insert({
                    ...exerciseData,
                    is_custom: true,
                    user_id: user?.id
                })
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            console.log('[ExerciseManager] Custom exercise added:', data.id)
            queryClient.invalidateQueries({ queryKey: ['exercises'] })
            setIsDialogOpen(false)
            setNewExercise({ name: '', category: '', description: '' })
            toast.success("Exercise added successfully")
        },
        onError: (error) => {
            console.error('[ExerciseManager] Error adding exercise:', error)
            toast.error("Failed to add exercise")
        }
    })

    const updateExerciseMutation = useMutation({
        mutationFn: async (exerciseData: { id: string; name: string; category: string; description: string }) => {
            console.log('[ExerciseManager] Updating exercise:', exerciseData.id)
            const { data, error } = await supabase
                .from('exercises')
                .update({
                    name: exerciseData.name,
                    category: exerciseData.category,
                    description: exerciseData.description
                })
                .eq('id', exerciseData.id)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            console.log('[ExerciseManager] Exercise updated successfully')
            setIsEditMode(false)
            setNewExercise({ name: '', category: '', description: '' })
            toast.success("Exercise updated successfully")
        },
        onError: (error) => {
            console.error('[ExerciseManager] Error updating exercise:', error)
            toast.error("Failed to update exercise")
        }
    })

    const deleteExerciseMutation = useMutation({
        mutationFn: async (id: string) => {
            console.log('[ExerciseManager] Deleting exercise:', id)
            const { error } = await supabase.from('exercises').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            console.log('[ExerciseManager] Exercise deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['exercises'] })
            toast.success("Exercise deleted successfully")
        },
        onError: (error) => {
            console.error('[ExerciseManager] Error deleting exercise:', error)
            toast.error("Failed to delete exercise")
        }
    })

    const filteredExercises = exercises?.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.category?.toLowerCase().includes(search.toLowerCase())
    )

    const handleEditClick = (exercise: Exercise) => {
        setEditingExercise(exercise)
        setNewExercise({
            name: exercise.name,
            category: exercise.category || '',
            description: exercise.description || ''
        })
        setIsEditMode(true)
        setIsDialogOpen(true)
    }

    const handleDialogChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setIsEditMode(false)
            setEditingExercise(null)
            setNewExercise({ name: '', category: '', description: '' })
        }
    }

    const handleSubmit = () => {
        if (isEditMode && editingExercise) {
            updateExerciseMutation.mutate({ ...newExercise, id: editingExercise.id })
        } else {
            addExerciseMutation.mutate(newExercise)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
                    <p className="text-muted-foreground">Manage your exercise library</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                    <DialogTrigger asChild>
                        <Button size="icon">
                            <Plus className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
                            <DialogDescription>
                                {isEditMode ? 'Update the details of your custom exercise.' : 'Create a custom exercise to add to your workouts.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newExercise.name}
                                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                                    placeholder="e.g. Bench Press"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    value={newExercise.category}
                                    onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                                    placeholder="e.g. Chest"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={newExercise.description}
                                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                                    placeholder="Optional description..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit} disabled={addExerciseMutation.isPending || updateExerciseMutation.isPending || !newExercise.name}>
                                {(addExerciseMutation.isPending || updateExerciseMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? 'Update Exercise' : 'Save Exercise'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search exercises..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <LoadingSpinner />
                ) : filteredExercises?.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">No exercises found</div>
                ) : (
                    filteredExercises?.map((exercise) => (
                        <Card key={exercise.id}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        {exercise.name}
                                        {exercise.is_custom && <Badge variant="secondary" className="text-xs">Custom</Badge>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{exercise.category}</div>
                                    {exercise.description && (
                                        <div className="text-sm text-muted-foreground mt-1">{exercise.description}</div>
                                    )}
                                </div>
                                {exercise.is_custom && exercise.user_id === user?.id && (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(exercise)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the exercise
                                                        &quot;{exercise.name}&quot; and remove it from all programs.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteExerciseMutation.mutate(exercise.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
                {filteredExercises?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 text-muted-foreground">
                        <div className="bg-muted p-4 rounded-full">
                            <Dumbbell className="h-8 w-8 opacity-50" />
                        </div>
                        <p>No exercises found. Add one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
