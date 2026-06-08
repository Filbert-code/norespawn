import { Route, Routes } from 'react-router-dom'
import { AppShell, TakeoverShell } from '@/components/AppShell'
import { CalendarHomeScreen } from '@/screens/CalendarHome'
import { PlansScreen } from '@/screens/Plans'
import { SettingsScreen } from '@/screens/Settings'
import { WorkoutBuilderScreen } from '@/screens/WorkoutBuilder'
import { ForgePlanScreen } from '@/screens/ForgePlan'
import { ScheduleWorkoutScreen } from '@/screens/ScheduleWorkout'
import { SessionRecapScreen } from '@/screens/SessionRecap'
import { ExerciseDetailScreen } from '@/screens/ExerciseDetail'
import { LiveSessionScreen } from '@/screens/LiveSession'

// Real-app routing tree. Two layouts:
//   AppShell      — top-level screens with bottom tab bar
//   TakeoverShell — full-screen flows (no tab bar)
export function Home() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<CalendarHomeScreen />} />
        <Route path="plans" element={<PlansScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
      <Route element={<TakeoverShell />}>
        <Route path="builder" element={<WorkoutBuilderScreen />} />
        <Route path="forge" element={<ForgePlanScreen />} />
        <Route path="forge/:planId" element={<ForgePlanScreen />} />
        <Route path="schedule" element={<ScheduleWorkoutScreen />} />
        <Route path="recap/:sessionId" element={<SessionRecapScreen />} />
        <Route path="exercise/:slug" element={<ExerciseDetailScreen />} />
        <Route path="live/:sessionId" element={<LiveSessionScreen />} />
      </Route>
    </Routes>
  )
}
