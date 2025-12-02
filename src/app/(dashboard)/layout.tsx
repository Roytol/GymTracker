import { BottomNav } from "@/components/BottomNav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-1 pb-20 p-4">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
