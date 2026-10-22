/**
 * The Consumer: one draggable pet in `shell.overlay` per registered skin. The
 * pets share the main-view Session's facts (running, waiting, celebrating,
 * asleep) and each keeps its own position, dragging, and petting.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import type { WorkpetScene, WorkpetService, WorkpetSkin } from './contract.ts'
import type { Translate } from './locale.ts'
import { clampPosition, loadPosition, savePosition, type Position, type PositionStorage, type Viewport } from './placement.ts'
import { deriveScene, mainSessionId, runningHelpers, type SceneInput, type SessionListLike, type SessionStatusLike } from './scene.ts'
import type { ChatSignalTable } from './signals.ts'
import { PetStage } from './stage.tsx'

/** Selector hook as the slot owner passes it. */
type SelectorHook<S> = <T>(selector: (state: S) => T) => T
type StatusSnapshot = { get(id: string): SessionStatusLike | undefined }

/** Root standard props of `shell.overlay` this component reads. */
export interface OverlayProps {
  readonly t: Translate
  readonly useSessions?: SelectorHook<SessionListLike>
  readonly useSessionStatus?: SelectorHook<StatusSnapshot>
  readonly usePanelInfo?: SelectorHook<{ activePanelId: string | null }>
}

/** Timing of the overlay's transient states, in milliseconds. */
export const TIMING = {
  petted: 3200,
  done: 6000,
  error: 10_000,
  /** Idle time before the pet falls asleep. */
  sleepAfter: 70_000,
  sleepCheck: 5_000,
} as const

/** Session facts every pet shares; dragging and petting belong to each pet. */
type SharedFacts = Omit<SceneInput, 'dragging' | 'petted'>

const NO_STATUS: StatusSnapshot = { get: () => undefined }
const identity = <T,>(value: T): T => value

function browserStorage(): PositionStorage | undefined {
  try {
    return globalThis.localStorage ?? undefined
  } catch (error) {
    // Storage blocked by the browser: positions last for this page only.
    void error
    return undefined
  }
}

function viewport(): Viewport {
  return typeof window === 'undefined' ? { width: 1200, height: 800 } : { width: window.innerWidth, height: window.innerHeight }
}

/**
 * Localized one-line status for a scene.
 * @param t - workpet translator.
 * @param scene - current scene.
 * @returns the status text.
 */
export function statusText(t: Translate, scene: WorkpetScene): string {
  switch (scene.activity) {
    case 'tool': return t('activity.tool', { tool: t(`tool.${scene.tool?.category ?? 'other'}`) })
    case 'awaiting': return t(`activity.awaiting.${scene.awaiting ?? 'other'}`)
    case 'delegating': return t('activity.delegating', { n: scene.helpers })
    default: return t(`activity.${scene.activity}`)
  }
}

/**
 * @param scene - current scene.
 * @returns the color tone of its status text, if any.
 */
export function toneOf(scene: WorkpetScene): 'warn' | 'error' | 'done' | undefined {
  if (scene.activity === 'awaiting' || scene.activity === 'retrying') return 'warn'
  if (scene.activity === 'error') return 'error'
  if (scene.activity === 'done') return 'done'
  return undefined
}

/**
 * Build the overlay component bound to its services.
 * @param workpet - the skin registry.
 * @param signals - per-Session Chat signals published by the probe.
 * @returns the `shell.overlay` component.
 */
export function createOverlay(workpet: WorkpetService, signals: ChatSignalTable): (props: OverlayProps) => ReactNode {
  return function WorkpetOverlay(props: OverlayProps): ReactNode {
    const { t } = props
    const { skins } = useSyncExternalStore(workpet.subscribe, workpet.getSnapshot, workpet.getSnapshot)
    const sessions = (props.useSessions ?? fallbackHook<SessionListLike | undefined>(undefined))(identity)
    const statuses = (props.useSessionStatus ?? fallbackHook<StatusSnapshot>(NO_STATUS))(identity) ?? NO_STATUS
    const panel = (props.usePanelInfo ?? fallbackHook<{ activePanelId: string | null }>({ activePanelId: null }))(identity)

    const sessionId = useMemo(() => mainSessionId(sessions), [sessions])
    const status = sessionId === undefined ? undefined : statuses.get(sessionId)
    const running = status?.running ?? (sessionId === undefined ? undefined : sessions?.byId?.[sessionId]?.running) ?? false
    const pending = status?.pendingInteraction?.kind
    const helpers = sessionId === undefined ? 0 : runningHelpers(sessions, id => statuses.get(id), sessionId)
    const signal = useSyncExternalStore(signals.subscribe, () => signals.read(sessionId), () => undefined)

    // --- turn-end celebration -------------------------------------------------
    const [celebration, setCelebration] = useState<'done' | 'error' | undefined>(undefined)
    const celebrationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const clearCelebrationTimer = (): void => {
      if (celebrationTimer.current !== undefined) clearTimeout(celebrationTimer.current)
      celebrationTimer.current = undefined
    }
    const showCelebration = (outcome: 'done' | 'error'): void => {
      clearCelebrationTimer()
      setCelebration(outcome)
      celebrationTimer.current = setTimeout(() => {
        celebrationTimer.current = undefined
        setCelebration(undefined)
      }, outcome === 'error' ? TIMING.error : TIMING.done)
    }
    const observed = useRef({ sessionId, running })
    const idleSince = useRef(Date.now())
    useEffect(() => () => clearCelebrationTimer(), [])
    const failedRef = useRef(false)
    failedRef.current = signal?.lastTurnFailed ?? false
    useEffect(() => {
      const previous = observed.current
      observed.current = { sessionId, running }
      if (running || previous.sessionId !== sessionId) {
        clearCelebrationTimer()
        setCelebration(undefined)
        idleSince.current = Date.now()
        return undefined
      }
      idleSince.current = Date.now()
      if (!previous.running) return undefined
      showCelebration(failedRef.current ? 'error' : 'done')
      return undefined
    }, [sessionId, running])

    // A failure can settle after `running` already dropped (or without a run
    // ever being observed), so a fresh failed turn upgrades or starts the
    // error celebration. Switching Sessions only re-baselines.
    const failed = signal?.lastTurnFailed ?? false
    const failedSeen = useRef({ sessionId, failed })
    useEffect(() => {
      const previous = failedSeen.current
      failedSeen.current = { sessionId, failed }
      if (previous.sessionId !== sessionId || !failed || previous.failed || running) return undefined
      idleSince.current = Date.now()
      showCelebration('error')
      return undefined
    }, [sessionId, failed, running])

    // --- dozing off -----------------------------------------------------------
    const [asleep, setAsleep] = useState(false)
    useEffect(() => {
      if (running || pending !== undefined) {
        setAsleep(false)
        return undefined
      }
      const check = (): void => setAsleep(Date.now() - idleSince.current > TIMING.sleepAfter)
      check()
      const timer = setInterval(check, TIMING.sleepCheck)
      return () => clearInterval(timer)
    }, [running, pending, sessionId])

    if (skins.length === 0) return null

    const facts: SharedFacts = { hasSession: sessionId !== undefined, running, pending, signal, helpers, celebration, asleep }
    const sessionTitle = sessionId === undefined ? undefined : sessions?.byId?.[sessionId]?.displayTitle ?? ''
    const showLabel = panel?.activePanelId == null

    return (
      <>
        {skins.map((skin, index) => (
          <PetSprite key={skin.id} skin={skin} index={index} facts={facts} t={t} sessionTitle={sessionTitle} showLabel={showLabel} />
        ))}
      </>
    )
  }
}

interface PetSpriteProps {
  readonly skin: WorkpetSkin
  /** Place in skin order; picks the default slot of a pet that was never moved. */
  readonly index: number
  readonly facts: SharedFacts
  readonly t: Translate
  /** Display title of the main-view Session; undefined when none is open. */
  readonly sessionTitle: string | undefined
  readonly showLabel: boolean
}

/** One pet: its own position, dragging, and petting over the shared facts. */
function PetSprite({ skin, index, facts, t, sessionTitle, showLabel }: PetSpriteProps): ReactNode {
  // --- position and dragging -------------------------------------------------
  const [position, setPosition] = useState(() => loadPosition(browserStorage(), skin.id, index, viewport()))
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; from: Position; to: Position; moved: boolean } | null>(null)
  useEffect(() => {
    const onResize = (): void => setPosition(current => clampPosition(current, viewport()))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // --- petting -----------------------------------------------------------------
  const [petted, setPetted] = useState(false)
  const pettedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pet = useCallback(() => {
    setPetted(true)
    clearTimeout(pettedTimer.current)
    pettedTimer.current = setTimeout(() => setPetted(false), TIMING.petted)
  }, [])
  useEffect(() => () => clearTimeout(pettedTimer.current), [])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    drag.current = { x: event.clientX, y: event.clientY, from: position, to: position, moved: false }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [position])
  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (state === null) return
    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    if (!state.moved && Math.hypot(dx, dy) > 4) {
      state.moved = true
      setDragging(true)
    }
    if (!state.moved) return
    state.to = clampPosition({ right: state.from.right - dx, bottom: state.from.bottom - dy }, viewport())
    setPosition(state.to)
  }, [])
  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (state === null) return
    if (state.moved) {
      setDragging(false)
      savePosition(browserStorage(), skin.id, state.to)
    } else {
      pet()
    }
  }, [pet, skin.id])

  const scene = deriveScene({ ...facts, dragging, petted })
  const label = statusText(t, scene)
  const tone = toneOf(scene)
  const alert = scene.activity === 'awaiting' || scene.activity === 'done' || scene.activity === 'error'
  const title = sessionTitle === undefined ? t('overlay.hint') : `${sessionTitle}\n${label}`.trim()

  return (
    <div
      className="wp-root"
      data-skin={skin.id}
      data-activity={scene.activity}
      data-dragging={dragging ? 'true' : 'false'}
      data-alert={alert ? 'true' : 'false'}
      style={{ right: position.right, bottom: position.bottom }}
      role="button"
      tabIndex={0}
      title={title}
      aria-label={`${t('overlay.label')} · ${skin.title()}: ${label}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          pet()
        }
      }}
    >
      <div className="wp-stage"><PetStage skin={skin} scene={scene} /></div>
      {showLabel && <div className="wp-label" data-tone={tone ?? ''} aria-hidden="true">{label}</div>}
    </div>
  )
}

function fallbackHook<S>(value: S): SelectorHook<S> {
  return <T,>(selector: (state: S) => T): T => selector(value)
}
