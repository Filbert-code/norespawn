import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthContext, isEmailAllowed } from '@/lib/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession)
        // Strip the OAuth `?code=...` (or hash) from the URL after sign-in.
        if (event === 'SIGNED_IN' && window.location.search.includes('code=')) {
          window.history.replaceState({}, '', window.location.pathname)
        }
      },
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    const user = session?.user ?? null
    return {
      session,
      user,
      loading,
      isAllowed: isEmailAllowed(user?.email),
      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        if (error) console.error('Google sign-in failed:', error.message)
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }
  }, [session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
