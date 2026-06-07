import { LogOut, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export function Home() {
  const { user, signOut } = useAuth()

  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh flex-col">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              NoRespawn
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
            )}
            <Button variant="outline" size="lg" onClick={signOut}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            You&apos;re in. Let&apos;s train.
          </h1>
          <p className="mt-4 max-w-md text-balance text-muted-foreground">
            Your workout dashboard will live here. For now, you&apos;re
            successfully signed in with Google.
          </p>
        </main>
      </div>
    </div>
  )
}
