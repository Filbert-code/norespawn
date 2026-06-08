const CANDIDATES = [
  {
    id: 'oswald',
    name: 'Oswald',
    note: 'Current — condensed military sans. Clean but generic.',
    family: "'Oswald Variable', sans-serif",
    weight: 700,
    tracking: '0.18em',
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    note: 'Roman engraved capitals. Monumental, imperial, "Adeptus" feel.',
    family: "'Cinzel Variable', serif",
    weight: 700,
    tracking: '0.12em',
  },
  {
    id: 'grenze',
    name: 'Grenze Gotisch',
    note: 'Condensed gothic / blackletter hybrid. Grimdark banner, still legible.',
    family: "'Grenze Gotisch', serif",
    weight: 900,
    tracking: '0.04em',
  },
  {
    id: 'pirata',
    name: 'Pirata One',
    note: 'Heavy blackletter display. Most decorative / metal.',
    family: "'Pirata One', system-ui",
    weight: 400,
    tracking: '0.02em',
  },
]

export function TypographyLab() {
  return (
    <div className="grimdark min-h-full bg-nr-black px-8 py-10 text-nr-bone">
      <div className="mx-auto max-w-3xl">
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-nr-bronze">Typography Lab</p>
        <h1 className="mb-2 font-heading text-3xl font-bold uppercase tracking-wide">
          Pick a display font
        </h1>
        <p className="mb-8 max-w-xl text-sm text-nr-bone/50">
          Each block shows the same wordmark, a screen heading, and a small label so you can
          judge headlines and UI labels together. Body text stays Geist for legibility.
        </p>

        <div className="space-y-4">
          {CANDIDATES.map((c) => (
            <div
              key={c.id}
              className="clip-bevel border border-nr-bronze/30 bg-nr-gunmetal/40 p-6"
            >
              <div className="mb-4 flex items-baseline justify-between border-b border-nr-bronze/15 pb-2">
                <span className="text-sm font-semibold uppercase tracking-widest text-nr-bone">
                  {c.name}
                </span>
                <span className="text-xs text-nr-bone/40">{c.note}</span>
              </div>

              {/* wordmark */}
              <div
                style={{
                  fontFamily: c.family,
                  fontWeight: c.weight,
                  letterSpacing: c.tracking,
                }}
                className="text-5xl uppercase leading-none text-nr-bone"
              >
                NoRespawn
              </div>

              {/* heading + label */}
              <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
                <span
                  style={{ fontFamily: c.family, fontWeight: c.weight, letterSpacing: c.tracking }}
                  className="text-2xl uppercase text-nr-crimson"
                >
                  Forge Plan
                </span>
                <span
                  style={{ fontFamily: c.family, fontWeight: c.weight, letterSpacing: '0.2em' }}
                  className="text-sm uppercase text-nr-bone/60"
                >
                  Discipline Streak
                </span>
                <span
                  style={{ fontFamily: c.family, fontWeight: c.weight, letterSpacing: '0.25em' }}
                  className="text-[11px] uppercase text-nr-bronze"
                >
                  Glory thru discipline
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
