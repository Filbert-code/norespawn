import { useState } from 'react'
import { LogOut, MonitorSmartphone, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PhoneFrame } from '@/mockups/components/PhoneFrame'
import { TabBar } from '@/mockups/components/TabBar'
import { ConfirmDialog } from '@/mockups/components/ConfirmDialog'

export function Settings() {
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [restSound, setRestSound] = useState(true)
  const [countdown, setCountdown] = useState(true)
  const [keepAwake, setKeepAwake] = useState(true)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const audioOff = muted || volume === 0

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col bg-nr-black text-nr-bone">
        {/* faint atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(122,30,30,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_20px_rgba(0,0,0,0.75)]" />

        {/* header */}
        <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
          <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
            NoRespawn
          </p>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.12em] text-nr-bone">
            Settings
          </h1>
        </header>

        <div className="relative flex-1 space-y-7 overflow-y-auto px-5 py-6">
          {/* ---- Profile ---- */}
          <Section title="Profile">
            <div className="flex items-center gap-3 py-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-nr-bronze/40 bg-nr-crimson/15 font-heading text-lg font-bold uppercase text-nr-ember">
                A
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-base uppercase tracking-wide text-nr-bone">
                  Alex Filbert
                </p>
                <p className="truncate text-[11px] text-nr-bone/45">
                  alexlingfungfilbert@gmail.com
                </p>
              </div>
            </div>
            <Row
              title="Units"
              desc="Weights shown in pounds"
              control={
                <span className="font-heading text-sm uppercase tracking-widest text-nr-bone/60">
                  lbs
                </span>
              }
            />
          </Section>

          {/* ---- Audio ---- */}
          <Section title="Audio">
            {/* master volume + mute */}
            <div className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-sm border transition-colors',
                      muted
                        ? 'border-nr-crimson/50 bg-nr-crimson/15 text-nr-ember'
                        : 'border-nr-bronze/30 text-nr-bone/70 hover:text-nr-bone',
                    )}
                  >
                    {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                  <div>
                    <p className="font-heading text-sm uppercase tracking-wide text-nr-bone">
                      Master Volume
                    </p>
                    <p className="text-[11px] text-nr-bone/45">Cues during live sessions</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-heading text-sm tabular-nums',
                    audioOff ? 'text-nr-bone/30' : 'text-nr-ember',
                  )}
                >
                  {muted ? 'Muted' : `${volume}%`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                disabled={muted}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-nr-bronze/25 accent-nr-crimson disabled:cursor-not-allowed disabled:opacity-40"
              />
            </div>

            <Row
              title="Rest-Complete Sound"
              desc="Play a sound the moment rest ends"
              control={
                <Toggle checked={restSound} disabled={audioOff} onChange={setRestSound} label="Rest-complete sound" />
              }
            />
            <Row
              title="Countdown Beeps"
              desc="3 · 2 · 1 in the final seconds of rest"
              control={
                <Toggle checked={countdown} disabled={audioOff} onChange={setCountdown} label="Countdown beeps" />
              }
            />
          </Section>

          {/* ---- Session ---- */}
          <Section title="Session">
            <Row
              title="Keep Screen Awake"
              desc="Prevent sleep during a live workout"
              icon={<MonitorSmartphone className="size-4 text-nr-bronze" />}
              control={<Toggle checked={keepAwake} onChange={setKeepAwake} label="Keep screen awake" />}
            />
          </Section>

          {/* ---- Sign out ---- */}
          <button
            onClick={() => setConfirmSignOut(true)}
            className="clip-bevel-sm flex w-full items-center justify-center gap-2 border border-nr-crimson/45 bg-nr-crimson/10 py-3 font-heading text-sm font-bold uppercase tracking-widest text-nr-ember transition-colors hover:bg-nr-crimson/20"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>

          <p className="pb-2 text-center text-[10px] uppercase tracking-[0.3em] text-nr-bone/25">
            NoRespawn · v0.1
          </p>
        </div>

        <TabBar />

        <ConfirmDialog
          open={confirmSignOut}
          title="Sign Out"
          message="You'll need to sign in with Google again to return to the fight."
          confirmLabel="Sign Out"
          onConfirm={() => setConfirmSignOut(false)}
          onCancel={() => setConfirmSignOut(false)}
        />
      </div>
    </PhoneFrame>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-[11px] uppercase tracking-[0.3em] text-nr-bronze">
        {title}
      </h2>
      <div className="clip-bevel-sm divide-y divide-nr-bronze/10 border border-nr-bronze/20 bg-nr-gunmetal/30 px-4">
        {children}
      </div>
    </section>
  )
}

function Row({
  title,
  desc,
  icon,
  control,
}: {
  title: string
  desc: string
  icon?: React.ReactNode
  control: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex size-9 items-center justify-center rounded-sm border border-nr-bronze/30">
            {icon}
          </span>
        )}
        <div>
          <p className="font-heading text-sm uppercase tracking-wide text-nr-bone">{title}</p>
          <p className="text-[11px] text-nr-bone/45">{desc}</p>
        </div>
      </div>
      {control}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
        checked && !disabled
          ? 'border-nr-crimson bg-nr-crimson/80'
          : 'border-nr-bronze/30 bg-nr-black/60',
        disabled && 'opacity-35',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-nr-bone transition-all',
          checked ? 'left-[1.45rem]' : 'left-0.5',
        )}
      />
    </button>
  )
}
