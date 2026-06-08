import { Outlet } from 'react-router-dom'
import { AppTabBar } from '@/components/AppTabBar'
import { OfflineBanner } from '@/components/OfflineBanner'

// Full-screen mobile-first layout. The tab bar is rendered on top-level
// screens via this shell; takeover routes (Live Session, Forge Plan, Workout
// Builder, Schedule Workout, Recap, Exercise Detail) render outside the shell.
export function AppShell() {
  return (
    <div className="dark grimdark mx-auto flex min-h-svh max-w-md flex-col bg-nr-black font-sans text-nr-bone">
      <OfflineBanner />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      <AppTabBar />
    </div>
  )
}

// Full-screen wrapper for takeover routes — no tab bar, no max-width frame.
export function TakeoverShell() {
  return (
    <div className="dark grimdark relative mx-auto flex min-h-svh max-w-md flex-col overflow-hidden bg-nr-black font-sans text-nr-bone">
      <OfflineBanner />
      <Outlet />
    </div>
  )
}
