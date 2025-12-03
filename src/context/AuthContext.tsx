'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type AuthContextType = {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) {
                    console.error('[Auth] Error checking session:', error)
                }

                if (session) {
                    console.log('[Auth] Session restored:', {
                        user: session.user.email,
                        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'never'
                    })
                    setSession(session)
                    setUser(session.user)
                } else {
                    console.log('[Auth] No active session found')
                }
            } catch (err) {
                console.error('[Auth] Unexpected error checking session:', err)
            } finally {
                setLoading(false)
            }
        }

        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`[Auth] State change: ${event}`, {
                user: session?.user?.email,
                expires_at: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
            })

            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)

            if (event === 'TOKEN_REFRESHED') {
                console.log('[Auth] Token refreshed successfully')
            }
            if (event === 'SIGNED_OUT') {
                console.log('[Auth] User signed out')
                router.refresh() // Force refresh to clear any server state
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, router])

    const signOut = async () => {
        console.log('[Auth] Signing out...')
        try {
            await supabase.auth.signOut()
            console.log('[Auth] Signed out successfully')
            router.push('/auth')
        } catch (error) {
            console.error('[Auth] Sign out error:', error)
        }
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
