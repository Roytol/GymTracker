'use client'

import { useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { Card, CardContent } from '@/components/ui/card'
import { PartyPopper } from 'lucide-react'

export function CelebrationCheck({ supabase, userId }: { supabase: SupabaseClient, userId?: string }) {
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        async function check() {
            if (!userId) return

            // Check for any completed workout today
            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)

            const endOfDay = new Date()
            endOfDay.setHours(23, 59, 59, 999)

            const { count } = await supabase
                .from('workouts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'completed')
                .gte('ended_at', startOfDay.toISOString())
                .lte('ended_at', endOfDay.toISOString())

            if (count && count > 0) {
                setCompleted(true)
            }
        }
        check()
    }, [supabase, userId])

    if (!completed) return null

    return (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-green-700 dark:text-green-300">Nice work!</h3>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80">You achieved your goals for today.</p>
                </div>
            </CardContent>
        </Card>
    )
}
