/**
 * The Consumer: a draggable pet in `shell.overlay` that mirrors the main-view
 * Session through the selected skin.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import type { WorkpetScene, WorkpetService } from './contract.ts'
import type { Translate } from './locale.ts'
import { deriveScene, mainSessionId, runningHelpers, type SessionListLike, type SessionStatusLike } from './scene.ts'
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
  petted: 1600,
  done: 2600,
  error: 5200,
  /** Idle time before the pet falls asleep. */
  sleepAfter: 70_000,
  sleepCheck: 5_000,
} as const

const POSITION_KEY = 'dsh-workpet:position'
const DEFAULT_POSITION = { right: 28, bottom: 96 }

interface Position { readonly right: number; readonly bottom: number }

function loadPosition(): Position {
  try {
    const raw = globalThis.localStorage?.getItem(POSITION_KEY)
    if (raw != null) {
      const parsed = JSON.parse(raw) as Partial<Position>
      if (typeof parsed.right === 'number' && typeof parsed.bottom === 'number') return clamp({ right: parsed.right, bottom: parsed.bottom })
    }
  } catch (error) {
    // Unreadable or corrupt entry: start from the default corner.
    void error
  }
  return DEFAULT_POSITION
}

function savePosition(position: Position): void {
  try {
    globalThis.localStorage?.setItem(POSITION_KEY, JSON.stringify(position))
  } catch (error) {
    // Storage unavailable: the position lasts for this page only.
    void error
  }
}

function clamp(position: Position): Position {
  const width = typeof window === 'undefined' ? 1200 : window.innerWidth
  const height = typeof window === 'undefined' ? 800 : window.innerHeight
  return {
    right: Math.min(Math.max(position.right, 4), Math.max(4, width - 124)),
    bottom: Math.min(Math.max(position.bottom, 4), Math.max(4, height - 108)),
  }
}

const NO_STATUS: StatusSnapshot = { get: () => undefined }
const identity = <T,>(value: T): T => value

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

function toneOf(scene: WorkpetScene): 'warn' | 'error' | 'done' | undefined {
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
    const registry = useSyncExternalStore(workpet.subscribe, workpet.getSnapshot, workpet.getSnapshot)
    const sessions = (props.useSessions ?? fallbackHook<SessionListLike | undefined>(undefined))(identity)
    const statuses = (props.useSessionStatus ?? fallbackHook<StatusSnapshot>(NO_STATUS))(identity) ?? NO_STATUS
    const panel = (props.usePanelInfo ?? fallbackHook<{ activePanelId: string | null }>({ activePanelId: null }))(identity)

    const sessionId = useMemo(() => mainSessionId(sessions), [sessions])
    const status = sessionId === undefined ? undefined : statuses.get(sessionId)
    const running = status?.running ?? (sessionId === undefined ? undefined : sessions?.byId?.[sessionId]?.running) ?? false
    const pending = status?.pendingInteraction?.kind
    const helpers = sessionId === undefined ? 0 : runningHelpers(sessions, id => statuses.get(id), sessionId)
    const signal = useSyncExternalStore(signals.subscribe, () => signals.read(sessionId), () => undefined)

    // --- position and dragging ---------------------------------------------
    const [position, setPosition] = useState(loadPosition)
    const [dragging, setDragging] = useState(false)
    const drag = useRef<{ x: number; y: number; from: Position; moved: boolean } | null>(null)
    useEffect(() => {
      const onResize = (): void => setPosition(clamp)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [])

    // --- petting -------------------------------------------------------------
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
      drag.current = { x: event.clientX, y: event.clientY, from: position, moved: false }
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
      if (state.moved) setPosition(clamp({ right: state.from.right - dx, bottom: state.from.bottom - dy }))
    }, [])
    const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
      const state = drag.current
      drag.current = null
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      if (state === null) return
      if (state.moved) {
        setDragging(false)
        setPosition(current => { savePosition(current); return current })
      } else {
        pet()
      }
    }, [pet])

    // --- turn-end celebration -------------------------------------------------
    const [celebration, setCelebration] = useState<'done' | 'error' | undefined>(undefined)
    const observed = useRef({ sessionId, running })
    const idleSince = useRef(Date.now())
    const failedRef = useRef(false)
    failedRef.current = signal?.lastTurnFailed ?? false
    useEffect(() => {
      const previous = observed.current
      observed.current = { sessionId, running }
      if (running || previous.sessionId !== sessionId) {
        setCelebration(undefined)
        idleSince.current = Date.now()
        return undefined
      }
      idleSince.current = Date.now()
      if (!previous.running) return undefined
      const outcome = failedRef.current ? 'error' : 'done'
      setCelebration(outcome)
      const timer = setTimeout(() => setCelebration(undefined), outcome === 'error' ? TIMING.error : TIMING.done)
      return () => clearTimeout(timer)
    }, [sessionId, running])

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

    const skin = registry.current
    if (skin === undefined) return null

    const scene = deriveScene({
      hasSession: sessionId !== undefined, running, pending, signal, helpers, dragging, petted, celebration, asleep,
    })
    const label = statusText(t, scene)
    const tone = toneOf(scene)
    const alert = scene.activity === 'awaiting' || scene.activity === 'done' || scene.activity === 'error'
    const title = sessionId === undefined ? t('overlay.hint') : `${sessions?.byId?.[sessionId]?.displayTitle ?? ''}\n${label}`.trim()
    const showLabel = panel?.activePanelId == null

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
        aria-label={`${t('overlay.label')}: ${label}`}
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
}

function fallbackHook<S>(value: S): SelectorHook<S> {
  return <T,>(selector: (state: S) => T): T => selector(value)
}
