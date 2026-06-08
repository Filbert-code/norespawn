import { Loader2, LogOut, ShieldX } from 'lucide-react'
import { Home } from '@/components/Home'
import { LoginPage } from '@/components/LoginPage'
import { useAuth } from '@/lib/auth'

function App() {
  const { session, user, loading, isAllowed, signOut } = useAuth()

  if (loading) {
    return (
      <div className="dark grimdark flex min-h-svh items-center justify-center bg-nr-black text-nr-bone">
        <Loader2 className="size-6 animate-spin text-nr-bronze" />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  if (!isAllowed) {
    return (
      <div className="dark grimdark flex min-h-svh items-center justify-center bg-nr-black px-6 text-nr-bone">
        <div className="clip-bevel w-full max-w-sm border border-nr-bronze/30 bg-nr-gunmetal p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-sm border border-nr-crimson/50 bg-nr-crimson/15 text-nr-ember">
            <ShieldX className="size-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-nr-bone">
            Access Restricted
          </h2>
          <p className="mt-2 text-sm text-nr-bone/55">
            {user?.email
              ? `${user.email} isn't allowed to use this app.`
              : 'This account is not allowed to use this app.'}
          </p>
          <button
            onClick={signOut}
            className="clip-bevel-sm mt-5 flex w-full items-center justify-center gap-2 border border-nr-bronze/40 py-3 font-heading text-sm font-semibold uppercase tracking-widest text-nr-bone/80 hover:border-nr-bronze hover:text-nr-bone"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <Home />
}

export default App
