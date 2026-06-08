import { Outlet } from 'react-router-dom'
import { AppTabBar } from '@/components/AppTabBar'
import { OfflineBanner } from '@/components/OfflineBanner'

// Full-screen mobile-first layout. The tab bar is rendered on top-level
// screens via this shell; takeover routes (Live Session, Forge Plan, Workout
// Builder, Schedule Workout, Recap, Exercise Detail) render outside the shell.
//
// Layout contract:
//   - Outer is clamped to `h-svh` + `overflow-hidden` so the shell never
//     grows past the small viewport (using `min-h-svh` allowed long screens
//     to push the tab bar below the fold on mobile).
//   - The tab bar is absolutely pinned at the bottom of the shell so it is
//     ALWAYS visible, regardless of route.
//   - Screen content scrolls *behind* the tab bar; trailing content gets
//     enough bottom padding (via `ScreenSurface` / individual screens) so
//     it can be scrolled into view above the tab bar.
export function AppShell() {
  return (
    <div className="dark grimdark relative mx-auto flex h-svh max-w-md flex-col overflow-hidden bg-nr-black font-sans text-nr-bone">
      <OfflineBanner />
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      <AppTabBar className="absolute inset-x-0 bottom-0 z-30" />
    </div>
  )
}

// Full-screen wrapper for takeover routes — no tab bar, no max-width frame.
export function TakeoverShell() {
  return (
    <div className="dark grimdark relative mx-auto flex h-svh max-w-md flex-col overflow-hidden bg-nr-black font-sans text-nr-bone">
      <OfflineBanner />
      <Outlet />
    </div>
  )
}
