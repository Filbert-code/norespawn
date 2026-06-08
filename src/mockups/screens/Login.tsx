import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { AshField } from '@/mockups/components/AshField'
// Build-time responsive variants: AVIF -> WebP -> PNG fallback. The source plate
// is pre-cropped to the phone aspect at 478px wide, so we cap variants there
// (requesting larger would just upscale). `as=picture` hands back a srcset per
// format + a fallback <img> descriptor.
import loginBg from '@/mockups/assets/login-bg.png?w=390;478&format=avif;webp;png&as=picture'
// Engraved-metal wordmark art. Generated on solid black, so we drop the black
// with `mix-blend-mode: screen` and let the letters glow over the plate.
import wordmark from '@/mockups/assets/wordmark.png?w=300;520;760&format=avif;webp;png&as=picture'
// Ornate metal plaque used as a 9-slice `border-image` for the button (the
// `fill` keyword paints the dark metal center as the button background).
import buttonPlate from '@/mockups/assets/button-plate.webp'

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
        {/* ---- ART LAYER: generated key-art plate (decorative, no text baked in) ---- */}
        <picture>
          {Object.entries(loginBg.sources).map(([format, srcSet]) => (
            <source key={format} type={`image/${format}`} srcSet={srcSet} />
          ))}
          <img
            src={loginBg.img.src}
            width={loginBg.img.w}
            height={loginBg.img.h}
            alt=""
            aria-hidden
            // This is the LCP element — fetch it eagerly + early, never lazy.
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        </picture>

        {/* ---- COMPOSITING LAYER: scrims that keep live text legible over the art ---- */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,12,14,0.35)_0%,transparent_22%,transparent_52%,rgba(12,12,14,0.82)_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(120%_90%_at_50%_120%,rgba(185,28,28,0.4),transparent_70%)] mix-blend-screen"
        />

        {/* live ember motion on top of the painted embers */}
        <AshField count={40} emberChance={0.24} sizeScale={1.2} />

        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_36px_rgba(0,0,0,0.85)]" />

        {/* ---- UI LAYER: real text + controls (crisp, translatable, accessible) ----
             The ring + skull are now part of the art plate, so the UI layer only
             carries live text. The wordmark drops into the clear dark band below
             the ring (ring center ~39% of the plate height, measured). */}
        <div className="relative flex-1">
          {/* wordmark block — sits in the dark band beneath the ring for legibility */}
          <div className="absolute inset-x-0 top-[64%] flex flex-col items-center px-8">
            {/* local scrim so the type reads cleanly over the textured wall */}
            <span
              aria-hidden
              className="absolute -inset-x-4 -inset-y-10 -z-10 bg-[radial-gradient(60%_120%_at_50%_50%,rgba(12,12,14,0.88),rgba(12,12,14,0.5)_45%,transparent_78%)] blur-md"
            />

            {/* wordmark — engraved-metal art; `screen` blend drops its black bg
                so the letters glow over the plate. Alt text keeps the heading. */}
            <h1 className="w-[78%] max-w-[290px]">
              <picture>
                {Object.entries(wordmark.sources).map(([format, srcSet]) => (
                  <source key={format} type={`image/${format}`} srcSet={srcSet} />
                ))}
                <img
                  src={wordmark.img.src}
                  width={wordmark.img.w}
                  height={wordmark.img.h}
                  alt="NoRespawn"
                  className="w-full mix-blend-screen drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]"
                />
              </picture>
            </h1>

            {/* divider with bronze diamond */}
            <div className="mt-4 flex w-44 items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-nr-bronze/60" />
              <span className="size-1.5 rotate-45 bg-nr-bronze/80" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-nr-bronze/60" />
            </div>

            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.35em] text-nr-bone/65 drop-shadow-[0_1px_8px_rgba(0,0,0,0.95)]">
              Glory thru discipline
            </p>
          </div>

          {/* sign-in — pinned to bottom. The generated metal plaque is used as a
              9-slice border-image: corners stay crisp, the `fill` center metal
              becomes the button background, edges stretch to any width. */}
          <div className="absolute inset-x-0 bottom-0 px-8 pb-12">
            <button
              className="group flex w-full items-center justify-center gap-3 py-4 transition-[filter] hover:brightness-110"
              style={{
                borderStyle: 'solid',
                borderWidth: '17px 22px',
                borderColor: 'transparent',
                borderImageSource: `url(${buttonPlate})`,
                borderImageSlice: '23% 13% fill',
                borderImageWidth: '17px 22px',
                borderImageRepeat: 'stretch',
                // Cut the plaque's black bevel-corner triangles so the button
                // reads as an octagonal plate, not a black rectangle.
                clipPath:
                  'polygon(11px 0, calc(100% - 11px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 11px) 100%, 11px 100%, 0 calc(100% - 9px), 0 9px)',
              }}
            >
              <span className="flex size-7 items-center justify-center rounded-sm bg-nr-bone shadow-[0_0_10px_rgba(0,0,0,0.6)]">
                <GoogleGlyph />
              </span>
              <span className="font-heading text-sm font-semibold uppercase tracking-widest text-nr-bone drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                Enter with Google
              </span>
            </button>

            <p className="mt-5 text-center text-[10px] uppercase tracking-[0.3em] text-nr-bone/40 drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)]">
              Entry granted to the chosen few
            </p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}
