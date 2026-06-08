import { AshField } from '@/mockups/components/AshField'
import loginBg from '@/mockups/assets/login-bg.png?w=390;478;760&format=avif;webp;png&as=picture'
import wordmark from '@/mockups/assets/wordmark.png?w=300;520;760&format=avif;webp;png&as=picture'
import buttonPlate from '@/mockups/assets/button-plate.webp'
import { GoogleIcon } from '@/components/GoogleIcon'
import { useAuth } from '@/lib/auth'

// Real auth-gating LoginPage — grimdark visuals ported from `mockups/Login.tsx`.
// No PhoneFrame; this fills the device viewport (capped to a narrow max-width
// so desktop preview matches the mobile-first design).
export function LoginPage() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="dark grimdark min-h-svh bg-nr-black font-sans text-nr-bone">
      <div className="relative mx-auto flex min-h-svh max-w-md flex-col overflow-hidden bg-nr-black">
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
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        </picture>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,12,14,0.35)_0%,transparent_22%,transparent_52%,rgba(12,12,14,0.82)_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(120%_90%_at_50%_120%,rgba(185,28,28,0.4),transparent_70%)] mix-blend-screen"
        />

        <AshField count={40} emberChance={0.24} sizeScale={1.2} />

        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_36px_rgba(0,0,0,0.85)]" />

        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-[58%] flex flex-col items-center px-8">
            <span
              aria-hidden
              className="absolute -inset-x-4 -inset-y-10 -z-10 bg-[radial-gradient(60%_120%_at_50%_50%,rgba(12,12,14,0.88),rgba(12,12,14,0.5)_45%,transparent_78%)] blur-md"
            />
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

            <div className="mt-4 flex w-44 items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-nr-bronze/60" />
              <span className="size-1.5 rotate-45 bg-nr-bronze/80" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-nr-bronze/60" />
            </div>

            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.35em] text-nr-bone/65 drop-shadow-[0_1px_8px_rgba(0,0,0,0.95)]">
              Glory thru discipline
            </p>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-8 pb-[max(env(safe-area-inset-bottom),3rem)]">
            <button
              onClick={signInWithGoogle}
              className="group flex w-full items-center justify-center gap-3 py-4 transition-[filter] hover:brightness-110"
              style={{
                borderStyle: 'solid',
                borderWidth: '17px 22px',
                borderColor: 'transparent',
                borderImageSource: `url(${buttonPlate})`,
                borderImageSlice: '23% 13% fill',
                borderImageWidth: '17px 22px',
                borderImageRepeat: 'stretch',
                clipPath:
                  'polygon(11px 0, calc(100% - 11px) 0, 100% 9px, 100% calc(100% - 9px), calc(100% - 11px) 100%, 11px 100%, 0 calc(100% - 9px), 0 9px)',
              }}
            >
              <span className="flex size-7 items-center justify-center rounded-sm bg-nr-bone shadow-[0_0_10px_rgba(0,0,0,0.6)]">
                <GoogleIcon className="size-5" />
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
    </div>
  )
}
