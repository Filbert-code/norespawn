import { Skull } from 'lucide-react'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { AshField } from '@/mockups/components/AshField'

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 36 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}

export function Login() {
  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col overflow-hidden bg-nr-black">
        {/* layered atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_115%,rgba(185,28,28,0.45),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(176,141,87,0.12),transparent_45%)]" />
        {/* faint emblem behind */}
        <div className="pointer-events-none absolute inset-x-0 top-[26%] flex justify-center">
          <Skull className="size-64 text-nr-bone/[0.025]" strokeWidth={0.5} />
        </div>
        {/* floating ash */}
        <AshField />
        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_30px_rgba(0,0,0,0.85)]" />

        {/* ---- content ---- */}
        <div className="relative flex flex-1 flex-col items-center px-8 pt-[22%]">
          {/* emblem */}
          <div className="relative mb-7 flex size-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-nr-bronze/40" />
            <span className="absolute inset-1.5 rounded-full border border-nr-bronze/20" />
            <span className="absolute inset-0 rounded-full bg-nr-crimson/10 blur-md" />
            <Skull className="size-12 text-nr-bronze" strokeWidth={1.5} />
          </div>

          {/* wordmark */}
          <h1 className="font-heading text-[2.6rem] font-bold uppercase leading-none tracking-[0.06em] text-nr-bone">
            NoRespawn
          </h1>

          {/* divider with diamond */}
          <div className="mt-4 flex w-44 items-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-nr-bronze/50" />
            <span className="size-1.5 rotate-45 bg-nr-bronze/70" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-nr-bronze/50" />
          </div>

          <p className="mt-4 text-center text-[11px] uppercase tracking-[0.35em] text-nr-bone/45">
            Glory thru discipline
          </p>

          {/* spacer */}
          <div className="flex-1" />

          {/* sign-in */}
          <div className="w-full pb-12">
            <button className="clip-bevel group flex w-full items-center justify-center gap-3 border border-nr-bronze/40 bg-nr-gunmetal/70 py-3.5 backdrop-blur-sm transition-colors hover:border-nr-crimson hover:bg-nr-crimson/10">
              <span className="flex size-7 items-center justify-center rounded-sm bg-nr-bone">
                <GoogleGlyph />
              </span>
              <span className="font-heading text-sm font-semibold uppercase tracking-widest text-nr-bone group-hover:text-nr-bone">
                Enter with Google
              </span>
            </button>

            <p className="mt-5 text-center text-[10px] uppercase tracking-[0.3em] text-nr-bone/30">
              Entry granted to the chosen few
            </p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}
