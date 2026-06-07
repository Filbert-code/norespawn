import { Loader2, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Home } from '@/components/Home'
import { LoginPage } from '@/components/LoginPage'
import { useAuth } from '@/lib/auth'

function App() {
  const { session, user, loading, isAllowed, signOut } = useAuth()

  if (loading) {
    return (
      <div className="dark flex min-h-svh items-center justify-center bg-background text-foreground">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  if (!isAllowed) {
    return (
      <div className="dark flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
        <Card className="w-full max-w-sm border-border bg-card/60">
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldX className="size-6" />
            </div>
            <CardTitle className="text-2xl">Access restricted</CardTitle>
            <CardDescription>
              {user?.email
                ? `${user.email} isn't allowed to use this app.`
                : 'This account is not allowed to use this app.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="h-11 w-full text-base"
              variant="outline"
              onClick={signOut}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Home />
}

export default App
