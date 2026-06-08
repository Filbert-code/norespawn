import { Check, Plus, Skull } from 'lucide-react'

const PALETTE = [
  { name: 'Near-Black', hex: '#0c0c0e', cls: 'bg-nr-black' },
  { name: 'Gunmetal', hex: '#1a1b1e', cls: 'bg-nr-gunmetal' },
  { name: 'Deep Oxblood', hex: '#7f1d1d', cls: 'bg-nr-oxblood' },
  { name: 'Blood Crimson', hex: '#b91c1c', cls: 'bg-nr-crimson' },
  { name: 'Ember Glow', hex: '#ef4444', cls: 'bg-nr-ember' },
  { name: 'Bronze/Gold', hex: '#b08d57', cls: 'bg-nr-bronze' },
  { name: 'Bone White', hex: '#ece5d8', cls: 'bg-nr-bone' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-bold uppercase tracking-widest text-nr-bone">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DesignSystem() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8">
      <header className="space-y-1">
        <h1 className="font-heading text-4xl font-bold uppercase tracking-wide text-nr-bone">
          Design System
        </h1>
        <p className="text-sm text-nr-bone/50">
          Grimdark tokens shared by every NoRespawn mockup.
        </p>
      </header>

      <Section title="Palette">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {PALETTE.map((c) => (
            <div key={c.hex} className="space-y-1.5">
              <div
                className={`clip-bevel h-20 w-full border border-nr-bronze/30 ${c.cls}`}
              />
              <p className="font-heading text-xs uppercase tracking-wider text-nr-bone">
                {c.name}
              </p>
              <p className="font-mono text-[10px] text-nr-bone/40">{c.hex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3 border border-nr-bronze/20 bg-nr-gunmetal/40 p-6 clip-bevel">
          <p className="font-heading text-5xl font-bold uppercase tracking-wide text-nr-bone">
            Norespawn
          </p>
          <p className="font-heading text-2xl font-semibold uppercase tracking-widest text-nr-crimson">
            Glory thru discipline
          </p>
          <p className="max-w-prose text-sm text-nr-bone/70">
            Body copy uses Geist — clean and legible. Headings use Oswald, a
            condensed gothic-military face, always uppercase with wide tracking.
            Discipline is the shield. Strength is the weapon.
          </p>
        </div>
      </Section>

      <Section title="Buttons & Chips">
        <div className="flex flex-wrap items-center gap-3">
          <button className="clip-bevel bg-nr-crimson px-5 py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-bone shadow-[0_0_18px_-4px] shadow-nr-ember/80 hover:bg-nr-ember">
            Start Workout
          </button>
          <button className="clip-bevel-sm border border-nr-bronze/50 px-4 py-2.5 font-heading text-sm font-semibold uppercase tracking-widest text-nr-bronze hover:border-nr-bronze hover:text-nr-bone">
            View Logs
          </button>
          <span className="clip-bevel-sm bg-nr-crimson px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bone shadow-[0_0_14px_-2px] shadow-nr-ember/70">
            Chest
          </span>
          <span className="clip-bevel-sm border border-nr-bronze/30 px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-widest text-nr-bone/55">
            Back
          </span>
          <span className="flex size-8 items-center justify-center rounded-full border border-nr-bronze/40 bg-nr-black/70 text-nr-bronze">
            <Plus className="size-4" />
          </span>
          <span className="flex size-8 items-center justify-center rounded-full border border-nr-ember bg-nr-crimson text-nr-bone shadow-[0_0_12px] shadow-nr-ember/70">
            <Check className="size-4" />
          </span>
        </div>
      </Section>

      <Section title="Intensity Meter">
        <div className="flex items-center gap-3 border border-nr-bronze/20 bg-nr-gunmetal/40 p-5 clip-bevel">
          <span className="text-[10px] uppercase tracking-widest text-nr-bone/40">
            Intensity
          </span>
          <div className="flex flex-1 items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className={`h-3 flex-1 skew-x-[-20deg] ${i < 7 ? 'bg-nr-crimson' : 'bg-nr-bone/10'}`}
              />
            ))}
          </div>
          <Skull className="size-4 text-nr-bone/30" />
        </div>
      </Section>
    </div>
  )
}
