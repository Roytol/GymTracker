'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Play, LogOut, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { WeeklyCalendar } from "@/components/WeeklyCalendar"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase"
import { ThemeToggle } from "@/components/ThemeToggle"
import { CelebrationCheck } from "@/components/CelebrationCheck"

type Program = {
  id: string
  name: string
}

type ProgramDay = {
  id: string
  name: string
  exercises: any[]
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Home() {
  const { signOut, user } = useAuth()
  const supabase = createClient()
  const today = new Date()
  const currentDayIndex = (today.getDay() + 6) % 7 // Mon=0, Sun=6
  const currentDayName = WEEKDAYS[currentDayIndex]

  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

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
  const { data: todaysWorkout } = useQuery({
    queryKey: ['todaysWorkout', activeProgram?.id, currentDayName],
    queryFn: async () => {
      if (!activeProgram) return null
      const { data, error } = await supabase
        .from('program_days')
        .select('*, exercises:program_exercises(*)')
        .eq('program_id', activeProgram.id)
        .eq('name', currentDayName)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as ProgramDay | null
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
        .select('name, exercises:program_exercises(id)')
        .eq('program_id', activeProgram.id)

      if (error) throw error

      return data.map(day => ({
        dayName: day.name,
        hasWorkout: day.exercises && day.exercises.length > 0
      }))
    },
    enabled: !!activeProgram
  })

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm">
            <Image
              src="/logo-v2.png"
              alt="GymTracker Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary leading-none">GymTracker</h1>
            <p className="text-muted-foreground text-xs font-medium">{formattedDate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button size="icon" variant="ghost" onClick={() => signOut()} className="rounded-full hover:bg-muted">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <WeeklyCalendar schedule={schedule} />

      {/* Celebration Message */}
      {schedule?.find(d => d.dayName === currentDayName && d.hasWorkout) && (
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
                <Button
                  className="w-full font-bold h-12 text-base bg-white text-black hover:bg-white/90 shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  asChild
                >
                  <Link href={`/workout`}>
                    <Play className="mr-2 h-5 w-5 fill-current" /> Start Workout
                  </Link>
                </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>No Active Program</CardTitle>
              <CardDescription>Create a program to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
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
