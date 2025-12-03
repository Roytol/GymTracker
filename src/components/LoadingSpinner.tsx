import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
    className?: string
    size?: number
}

export function LoadingSpinner({ className, size = 32 }: LoadingSpinnerProps) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <Loader2
                className={cn("animate-spin text-primary", className)}
                size={size}
            />
        </div>
    )
}
