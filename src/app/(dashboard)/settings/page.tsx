'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, User, Settings, BarChart3 } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false)
    const [units, setUnits] = useState('kg')
    const [weekStart, setWeekStart] = useState('monday')

    // Fetch Profile
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!user
    })

    // Sync local state with profile data
    useEffect(() => {
        if (profile) {
            setUnits(profile.units || 'kg')
            setWeekStart(profile.week_start_day || 'monday')
        }
    }, [profile])

    // Update Profile Mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (updates: { units?: string; week_start_day?: string }) => {
            console.log('Updating profile with:', updates)
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    email: user?.email,
                    updated_at: new Date().toISOString(),
                    ...updates
                })

            if (error) {
                console.error('Profile update error:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            toast.success("Settings updated")
        },
        onError: () => {
            // Revert local state on error
            if (profile) {
                setUnits(profile.units || 'kg')
                setWeekStart(profile.week_start_day || 'monday')
            }
            toast.error("Failed to update settings")
        }
    })

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['userStats'],
        queryFn: async () => {
            // Total Workouts
            const { count: workoutCount, error: workoutError } = await supabase
                .from('workouts')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .eq('user_id', user?.id)

            if (workoutError) throw workoutError

            // Total Volume (approximate)
            // const { data: logs, error: logsError } = await supabase
            //     .from('workout_logs')
            //     .select('weight, reps')
            //     .not('weight', 'is', null)
            //     .not('reps', 'is', null)
            // // This might be heavy for a real app, but fine for MVP

            // if (logsError) throw logsError

            // const totalVolume = logs.reduce((acc, log) => acc + (log.weight || 0) * (log.reps || 0), 0)

            return {
                totalWorkouts: workoutCount || 0,
                // totalVolume: Math.round(totalVolume) // Disabled for performance
            }
        },
        enabled: !!user
    })

    const handleUpdateEmail = async () => {
        if (!email) return
        setIsUpdatingAccount(true)
        try {
            const { error } = await supabase.auth.updateUser({ email })
            if (error) throw error
            toast.success("Confirmation email sent to new address")
            setEmail('')
        } catch (error: any) {
            toast.error(error.message || "Failed to update email")
        } finally {
            setIsUpdatingAccount(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (!password || password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        setIsUpdatingAccount(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            toast.success("Password updated successfully")
            setPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            toast.error(error.message || "Failed to update password")
        } finally {
            setIsUpdatingAccount(false)
        }
    }

    if (profileLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6 pb-24">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your preferences and account</p>
            </header>

            <Tabs defaultValue="preferences" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="preferences" className="flex gap-2"><Settings className="h-4 w-4" /> Preferences</TabsTrigger>
                    <TabsTrigger value="account" className="flex gap-2"><User className="h-4 w-4" /> Account</TabsTrigger>
                    <TabsTrigger value="stats" className="flex gap-2"><BarChart3 className="h-4 w-4" /> Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="preferences">
                    <Card>
                        <CardHeader>
                            <CardTitle>App Preferences</CardTitle>
                            <CardDescription>Customize your GymTracker experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">




                            <div className="space-y-2">
                                <Label>Weight Units</Label>
                                <Select
                                    value={units}
                                    onValueChange={(val) => {
                                        setUnits(val)
                                        updateProfileMutation.mutate({ units: val })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Week Start Day</Label>
                                <Select
                                    value={weekStart}
                                    onValueChange={(val) => {
                                        setWeekStart(val)
                                        updateProfileMutation.mutate({ week_start_day: val })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monday">Monday</SelectItem>
                                        <SelectItem value="sunday">Sunday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Management</CardTitle>
                            <CardDescription>Update your email or password</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Update Email</h3>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        placeholder="New Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <Button onClick={handleUpdateEmail} disabled={isUpdatingAccount || !email}>
                                        Update
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Change Password</h3>
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="New Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <Input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <Button
                                        onClick={handleUpdatePassword}
                                        disabled={isUpdatingAccount || !password || !confirmPassword}
                                        className="w-full"
                                    >
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Stats</CardTitle>
                            <CardDescription>Overview of your training journey</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-primary">{stats?.totalWorkouts}</div>
                                        <div className="text-sm text-muted-foreground">Workouts Completed</div>
                                    </div>
                                    {/* <div className="bg-muted/50 p-4 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-primary">
                                            {(stats?.totalVolume || 0).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Total Volume ({profile?.units || 'kg'})</div>
                                    </div> */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
