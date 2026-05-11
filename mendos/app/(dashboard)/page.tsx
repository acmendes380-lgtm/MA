import { AIInsight } from '@/components/dashboard/ai-insight'
import { DailyGoals } from '@/components/dashboard/daily-goals'
import { HabitStreaks } from '@/components/dashboard/habit-streaks'
import { ProductivityScore } from '@/components/dashboard/productivity-score'
import { SleepWidget } from '@/components/dashboard/sleep-widget'
import { QuickNotes } from '@/components/dashboard/quick-notes'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { WeeklySummary } from '@/components/dashboard/weekly-summary'
import { SectionHealth } from '@/components/dashboard/section-health'

export default function DashboardPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <AIInsight />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <DailyGoals />
        </div>
        <div className="lg:col-span-4">
          <HabitStreaks />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <ProductivityScore />
          <SleepWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <WeeklySummary />
        </div>
        <div className="lg:col-span-4">
          <UpcomingTasks />
        </div>
      </div>

      <SectionHealth />
      <QuickNotes />
    </div>
  )
}
