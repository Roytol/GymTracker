'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/programs', label: 'Programs', icon: Calendar },
    { href: '/workout', label: 'Workout', icon: Dumbbell },
    { href: '/exercises', label: 'Exercises', icon: Dumbbell }, // Maybe use a list icon?
    // { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-lg pb-safe">
            <nav className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
