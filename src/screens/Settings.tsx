import { useState } from 'react'
import { LogOut, MonitorSmartphone, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScreenSurface } from '@/screens/_shared/screen'
import { ConfirmDialog } from '@/mockups/components/ConfirmDialog'
import { useAuth } from '@/lib/auth'
import { usePrefs } from '@/lib/prefs'

export function SettingsScreen() {
  const { user, signOut } = useAuth()
  const [prefs, setPrefs] = usePrefs()
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const audioOff = !prefs.audioEnabled
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Operator'
  const avatarLetter = displayName.trim().charAt(0).toUpperCase() || '?'

  return (
    <ScreenSurface>
      <header className="relative border-b border-nr-bronze/15 px-5 pb-4 pt-9">
        <p className="font-heading text-[10px] uppercase tracking-[0.35em] text-nr-bronze/70">
          NoRespawn
        </p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.12em] text-nr-bone">
          Settings
        </h1>
      </header>

      <div className="relative flex-1 space-y-7 overflow-y-auto px-5 py-6 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]">
        <Section title="Profile">
          <div className="flex items-center gap-3 py-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-nr-bronze/40 bg-nr-crimson/15 font-heading text-lg font-bold uppercase text-nr-ember">
              {avatarLetter}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-base uppercase tracking-wide text-nr-bone">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-nr-bone/45">{user?.email ?? '—'}</p>
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

        <Section title="Audio">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setPrefs({ audioEnabled: !prefs.audioEnabled })}
                  aria-label={audioOff ? 'Unmute' : 'Mute'}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-sm border transition-colors',
                    audioOff
                      ? 'border-nr-crimson/50 bg-nr-crimson/15 text-nr-ember'
                      : 'border-nr-bronze/30 text-nr-bone/70 hover:text-nr-bone',
                  )}
                >
                  {audioOff ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <div>
                  <p className="font-heading text-sm uppercase tracking-wide text-nr-bone">
                    Audio Cues
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
                {audioOff ? 'Off' : 'On'}
              </span>
            </div>
          </div>

          <Row
            title="Set-Complete Sound"
            desc="Play a sound when a set is finished"
            control={
              <Toggle
                checked={prefs.setCompleteCue}
                disabled={audioOff}
                onChange={(v) => setPrefs({ setCompleteCue: v })}
                label="Set-complete sound"
              />
            }
          />
          <Row
            title="Countdown Beeps"
            desc="3 · 2 · 1 in the final seconds of rest"
            control={
              <Toggle
                checked={prefs.restCountdownCue}
                disabled={audioOff}
                onChange={(v) => setPrefs({ restCountdownCue: v })}
                label="Countdown beeps"
              />
            }
          />
        </Section>

        <Section title="Session">
          <Row
            title="Keep Screen Awake"
            desc="Prevent sleep during a live workout"
            icon={<MonitorSmartphone className="size-4 text-nr-bronze" />}
            control={
              <Toggle
                checked={prefs.wakeLockEnabled}
                onChange={(v) => setPrefs({ wakeLockEnabled: v })}
                label="Keep screen awake"
              />
            }
          />
          <Row
            title="Auto-Start After Rest"
            desc="Jump straight into the next set when rest ends"
            control={
              <Toggle
                checked={prefs.autoStartWorkAfterRest}
                onChange={(v) => setPrefs({ autoStartWorkAfterRest: v })}
                label="Auto-start after rest"
              />
            }
          />
        </Section>

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

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign Out"
        message="You'll need to sign in with Google again to return to the fight."
        confirmLabel="Sign Out"
        onConfirm={() => {
          setConfirmSignOut(false)
          signOut().catch(() => undefined)
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </ScreenSurface>
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
