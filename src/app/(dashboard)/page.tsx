'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Play, Calendar as CalendarIcon, CheckCircle2, Dumbbell } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { WeeklyCalendar } from "@/components/WeeklyCalendar"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase"
import { CelebrationCheck } from "@/components/CelebrationCheck"
import { LoadingSpinner } from "@/components/LoadingSpinner"

// ... imports ...

// ... inside component ...

// Loading State


type Program = {
  id: string
  name: string
}

type ProgramDay = {
  id: string
  name: string
  exercises: any[]
}



export default function Home() {
  const { signOut, user } = useAuth()
  const supabase = createClient()
  const today = new Date()

  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

  // Fetch User Profile for Settings
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase.from('profiles').select('week_start_day').eq('id', user.id).single()
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const weekStart = (profile?.week_start_day as 'monday' | 'sunday') || 'monday'

  // Calculate current day index based on week start preference
  // If Monday start: Mon=0, Sun=6. (today.getDay() + 6) % 7
  // If Sunday start: Sun=0, Sat=6. today.getDay()
  const currentDayIndex = weekStart === 'monday'
    ? (today.getDay() + 6) % 7
    : today.getDay()

  const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  // Fetch most recent program
  const { data: activeProgram } = useQuery({
    queryKey: ['activeProgram'],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
      return data as Program | null
    },
    enabled: !!user
  })

  // Fetch today's workout for the active program
  // We match by day name now to be safe regardless of order index
  const { data: todaysWorkout } = useQuery({
    queryKey: ['todaysWorkout', activeProgram?.id, currentDayName],
    queryFn: async () => {
      if (!activeProgram) return null

      // First try to find by name (safer)
      const { data: byName, error: nameError } = await supabase
        .from('program_days')
        .select('*, exercises:program_exercises(*)')
        .eq('program_id', activeProgram.id)
        .ilike('name', currentDayName)
        .maybeSingle()

      if (byName) return byName as ProgramDay

      // Fallback to order if name doesn't match (legacy support)
      // Note: This fallback assumes order was created with Monday=0
      // If we want to support Sunday start fully, program creation should probably store day names or explicit indices
      const { data: byOrder, error: orderError } = await supabase
        .from('program_days')
        .select('*, exercises:program_exercises(*)')
        .eq('program_id', activeProgram.id)
        .eq('"order"', (today.getDay() + 6) % 7) // Always use Monday-based index for fallback as that's how it was likely created
        .maybeSingle()

      return byOrder as ProgramDay | null
    },
    enabled: !!activeProgram
  })

  // Fetch full schedule for calendar indicators
  const { data: schedule } = useQuery({
    queryKey: ['programSchedule', activeProgram?.id],
    queryFn: async () => {
      if (!activeProgram) return []
      const { data, error } = await supabase
        .from('program_days')
        .select('name, order, exercises:program_exercises(id)')
        .eq('program_id', activeProgram.id)

      if (error) throw error

      return data.map(day => ({
        dayName: day.name,
        dayOrder: day.order,
        hasWorkout: day.exercises && day.exercises.length > 0
      }))
    },
    enabled: !!activeProgram
  })

  // Check if today's workout is already completed
  const { data: isWorkoutCompleted } = useQuery({
    queryKey: ['isWorkoutCompleted', user?.id],
    queryFn: async () => {
      if (!user) return false
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const { count } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('ended_at', startOfDay.toISOString())
        .lte('ended_at', endOfDay.toISOString())

      return count ? count > 0 : false
    },
    enabled: !!user
  })

  // Loading State
  const isLoading = !activeProgram && !schedule

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">


      <WeeklyCalendar schedule={schedule} weekStart={weekStart} />

      {/* Celebration Message */}
      {schedule?.find(d => d.dayOrder === currentDayIndex && d.hasWorkout) && (
        // This is a simplified check. Ideally we check the actual workout status.
        // Let's improve this by fetching today's completed workout.
        <CelebrationCheck supabase={supabase} userId={user?.id} />
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Workout</h2>
        {activeProgram ? (
          todaysWorkout && todaysWorkout.exercises.length > 0 ? (
            <Card className="bg-primary text-primary-foreground border-none shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-2xl">{todaysWorkout.name}</CardTitle>
                <CardDescription className="text-primary-foreground/80 text-base">
                  {activeProgram.name} • {todaysWorkout.exercises.length} Exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isWorkoutCompleted ? (
                  <Button
                    className="w-full font-bold h-12 text-base bg-white/20 text-white cursor-default hover:bg-white/20"
                    disabled
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Workout Completed
                  </Button>
                ) : (
                  <Button
                    className="w-full font-bold h-12 text-base bg-white text-black hover:bg-white/90 shadow-md transition-all hover:scale-[1.02] active:scale-95"
                    asChild
                  >
                    <Link href={`/workout`}>
                      <Play className="mr-2 h-5 w-5 fill-current" /> Start Workout
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Rest Day</CardTitle>
                <CardDescription>No workout scheduled for today. Enjoy your recovery!</CardDescription>
              </CardHeader>
            </Card>
          )
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Dumbbell className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">No Active Program</h3>
                <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                  You don't have a workout program set up yet. Create one to start tracking your progress!
                </p>
              </div>
              <Button className="w-full max-w-xs" asChild>
                <Link href="/programs/new">
                  <Plus className="mr-2 h-4 w-4" /> Create Program
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>


    </div>
  );
}
