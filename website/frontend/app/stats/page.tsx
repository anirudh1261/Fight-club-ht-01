import Sidebar from '@/components/Sidebar'
import StatsDashboard from '@/components/StatsDashboard'

export default function StatsPage() {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <main className="flex-1 lg:ml-72 p-4 lg:p-8 overflow-x-hidden">
                <StatsDashboard />
            </main>
        </div>
    )
}
