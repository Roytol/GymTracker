'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useAuth } from '@/context/AuthContext'
import {
    Settings,
    LogOut,
    Moon,
    Sun,
    Laptop,
    User,
    Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'

export function UserMenu() {
    const { setTheme } = useTheme()
    const { signOut } = useAuth()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Open user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-none border-border">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Palette className="mr-2 h-4 w-4" />
                        <span>Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Light</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Dark</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>System</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("midnight")}>
                            <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-tr from-[#FF00FF] to-[#00FFFF]" />
                            <span>Midnight Neon</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/20 cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
