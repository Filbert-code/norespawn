// Centralised query-key factory. Treat each top-level slice (`exercises`,
// `plans`, etc.) as its own "feature" — invalidate the whole slice or a
// specific row by composing the helpers below.
export const qk = {
  exercises: {
    all: ['exercises'] as const,
    list: () => [...qk.exercises.all, 'list'] as const,
    bodyGroups: () => [...qk.exercises.all, 'body_groups'] as const,
    detail: (slug: string) => [...qk.exercises.all, 'detail', slug] as const,
    history: (slug: string) => [...qk.exercises.all, 'history', slug] as const,
    lastPerformed: () => [...qk.exercises.all, 'last_performed'] as const,
  },
  plans: {
    all: ['plans'] as const,
    list: () => [...qk.plans.all, 'list'] as const,
    detail: (id: string) => [...qk.plans.all, 'detail', id] as const,
  },
  schedule: {
    all: ['schedule'] as const,
    range: (fromISO: string, toISO: string) =>
      [...qk.schedule.all, 'range', fromISO, toISO] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    range: (fromISO: string, toISO: string) =>
      [...qk.sessions.all, 'range', fromISO, toISO] as const,
    detail: (id: string) => [...qk.sessions.all, 'detail', id] as const,
    inProgress: () => [...qk.sessions.all, 'in_progress'] as const,
  },
  scores: {
    all: ['scores'] as const,
    current: () => [...qk.scores.all, 'current'] as const,
  },
  prs: {
    all: ['prs'] as const,
    forExercise: (slug: string) => [...qk.prs.all, 'exercise', slug] as const,
  },
} as const
