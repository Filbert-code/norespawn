import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GoogleIcon } from '@/components/GoogleIcon'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="dark flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-sm border-border bg-card/60">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-6" />
          </div>
          <CardTitle className="text-2xl">NoRespawn</CardTitle>
          <CardDescription>
            Sign in to start tracking. No second chances&mdash;just reps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="h-11 w-full text-base"
            variant="outline"
            onClick={signInWithGoogle}
          >
            <GoogleIcon className="size-5" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
