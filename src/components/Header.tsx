'use client'

import Image from 'next/image'
import { UserMenu } from '@/components/UserMenu'

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg shadow-sm">
                        <Image
                            src="/logo-v2.png"
                            alt="GymTracker Logo"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="font-bold text-lg tracking-tight">GymTracker</div>
                </div>
                <UserMenu />
            </div>
        </header>
    )
}
