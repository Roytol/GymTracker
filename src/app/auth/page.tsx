'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ThemeToggle'

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

const signupSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type LoginFormValues = z.infer<typeof loginSchema>
type SignupFormValues = z.infer<typeof signupSchema>

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const signupForm = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onLoginSubmit = async (data: LoginFormValues) => {
        setIsLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })
            if (error) throw error
            router.push('/')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const onSignupSubmit = async (data: SignupFormValues) => {
        setIsLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
            setSuccess(true)
        } catch (err: any) {
            console.error("Signup error:", err)
            setError(err.message || "An error occurred during signup")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4 transition-colors duration-300 relative">
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
                <Card className="w-full max-w-md border-border/50 shadow-xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-md ring-1 ring-border/50">
                                <Image
                                    src="/logo-v2.png"
                                    alt="GymTracker Logo"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-[#007AFF] dark:text-[#0A84FF]">Check your email</CardTitle>
                        <CardDescription>We&apos;ve sent a confirmation link to your email address.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground">
                            Please click the link in the email to verify your account and sign in.
                        </p>
                        <Button className="w-full h-12 text-lg font-semibold" onClick={() => setSuccess(false)}>
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4 transition-colors duration-300 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Card className="w-full max-w-md border-border/50 shadow-xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-md ring-1 ring-border/50">
                            <Image
                                src="/logo-v2.png"
                                alt="GymTracker Logo"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-[#007AFF] dark:text-[#0A84FF]">GymTracker</CardTitle>
                    <CardDescription>Track your progress, achieve your goals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/50">
                            <TabsTrigger value="login" className="h-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Login</TabsTrigger>
                            <TabsTrigger value="signup" className="h-full text-base font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="m@example.com" {...loginForm.register('email')} />
                                    {loginForm.formState.errors.email && <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" {...loginForm.register('password')} />
                                    {loginForm.formState.errors.password && <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>}
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-md hover:scale-[1.02] transition-all bg-[#007AFF] hover:bg-[#007AFF]/90 text-white" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    Login
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input id="signup-email" type="email" placeholder="m@example.com" {...signupForm.register('email')} />
                                    {signupForm.formState.errors.email && <p className="text-sm text-red-500">{signupForm.formState.errors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input id="signup-password" type="password" {...signupForm.register('password')} />
                                    {signupForm.formState.errors.password && <p className="text-sm text-red-500">{signupForm.formState.errors.password.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword" type="password" {...signupForm.register('confirmPassword')} />
                                    {signupForm.formState.errors.confirmPassword && <p className="text-sm text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>}
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-md hover:scale-[1.02] transition-all bg-[#007AFF] hover:bg-[#007AFF]/90 text-white" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    Sign Up
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
