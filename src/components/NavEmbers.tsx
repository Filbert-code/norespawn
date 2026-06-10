import { useMemo } from 'react'

interface Cinder {
  left: number
  size: number
  travel: number
  drift: number
  duration: number
  delay: number
  opacity: number
  ember: boolean
}

// Rising forge cinders sized for the short bottom-nav banner. Reuses the global
// `.nr-ash-mote` ember styling (see index.css) but with a short travel so motes
// drift just up across the bar instead of the full-screen distance AshField uses.
export function NavEmbers({ count = 14 }: { count?: number }) {
  const cinders = useMemo<Cinder[]>(
    () =>
      Array.from({ length: count }, () => {
        const ember = Math.random() < 0.78
        return {
          left: Math.random() * 100,
          size: ember ? 1.6 + Math.random() * 1.8 : 1.2 + Math.random() * 2,
          travel: 34 + Math.random() * 46,
          drift: (Math.random() - 0.5) * 26,
          duration: 3.4 + Math.random() * 3.2,
          delay: -Math.random() * 6,
          opacity: ember ? 0.55 + Math.random() * 0.4 : 0.3 + Math.random() * 0.4,
          ember,
        }
      }),
    [count],
  )

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {cinders.map((c, i) => (
        <span
          key={i}
          className={`nr-ash-mote${c.ember ? ' is-ember' : ''}`}
          style={
            {
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: `${c.size}px`,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
              '--ash-travel': `${c.travel}px`,
              '--ash-x': `${c.drift}px`,
              '--ash-o': c.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
