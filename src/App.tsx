import { Dumbbell, Flame, LineChart, Trophy, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const features = [
  {
    icon: Dumbbell,
    title: 'Log every set',
    description:
      'Track exercises, sets, reps, and weight in seconds. Built for the way you actually train.',
  },
  {
    icon: LineChart,
    title: 'See your progress',
    description:
      'Watch your lifts climb over time with clean, no-nonsense progress charts.',
  },
  {
    icon: Flame,
    title: 'Keep the streak',
    description:
      'Stay consistent with streaks and personal records that keep you coming back.',
  },
]

function App() {
  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <div className="relative flex min-h-svh flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              NoRespawn
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="lg">
              Sign in
            </Button>
            <Button size="lg">Get started</Button>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6">
          <section className="flex flex-col items-center pt-20 pb-16 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground">
              <Trophy className="size-4" />
              No second chances. Just reps.
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              Train like every set is your{' '}
              <span className="text-primary">last life</span>.
            </h1>
            <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              NoRespawn is the dead-simple workout tracker that keeps you
              accountable, consistent, and always leveling up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-11 px-6 text-base">
                Start tracking free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 text-base"
              >
                See how it works
              </Button>
            </div>
          </section>

          <section className="grid w-full gap-4 pb-24 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border bg-card/50">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </section>
        </main>

        <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} NoRespawn. Built for people who
          show up.
        </footer>
      </div>
    </div>
  )
}

export default App
