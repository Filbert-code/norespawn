import { useMemo } from 'react'

interface Mote {
  left: number
  size: number
  travel: number
  drift: number
  duration: number
  delay: number
  opacity: number
  ember: boolean
}

function makeMotes(count: number, emberChance: number): Mote[] {
  const motes: Mote[] = []
  for (let i = 0; i < count; i++) {
    const ember = Math.random() < emberChance
    motes.push({
      left: Math.random() * 100,
      size: ember ? 2 + Math.random() * 2 : 1.5 + Math.random() * 4,
      travel: 520 + Math.random() * 320,
      drift: (Math.random() - 0.5) * 90,
      duration: 9 + Math.random() * 12,
      delay: -Math.random() * 18,
      opacity: ember ? 0.5 + Math.random() * 0.4 : 0.25 + Math.random() * 0.45,
      ember,
    })
  }
  return motes
}

export function AshField({ count = 46, emberChance = 0.18 }: { count?: number; emberChance?: number }) {
  const motes = useMemo(() => makeMotes(count, emberChance), [count, emberChance])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((m, i) => (
        <span
          key={i}
          className={`nr-ash-mote${m.ember ? ' is-ember' : ''}`}
          style={
            {
              left: `${m.left}%`,
              width: `${m.size}px`,
              height: `${m.size}px`,
              animationDuration: `${m.duration}s`,
              animationDelay: `${m.delay}s`,
              '--ash-travel': `${m.travel}px`,
              '--ash-x': `${m.drift}px`,
              '--ash-o': m.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
