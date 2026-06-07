import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  /** True when the signed-in user is permitted to use the app. */
  isAllowed: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}

/**
 * App-level allowlist (fail-closed): only emails on this list may use the app.
 * Anyone else who authenticates with Google is denied access.
 *
 * The owner email is baked in so a missing env var can never lock you out.
 * Add more accounts via VITE_ALLOWED_EMAILS (comma-separated).
 *
 * Note: this only gates the UI. Real enforcement must live in Postgres RLS
 * once the app stores data.
 */
const OWNER_EMAILS = ['alexlingfungfilbert@gmail.com']

const allowedEmails = [
  ...OWNER_EMAILS,
  ...(import.meta.env.VITE_ALLOWED_EMAILS ?? '').split(','),
]
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function isEmailAllowed(email: string | null | undefined): boolean {
  return !!email && allowedEmails.includes(email.toLowerCase())
}
