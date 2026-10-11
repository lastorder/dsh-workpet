/**
 * Drawing parts of the cat: palette, the head with its eye/mouth variants, and
 * small scenery. Everything is original artwork drawn in a soft, hand-painted
 * picture-book style: warm cream fur with ginger patches, brown ink outlines,
 * rosy cheeks, a red neckerchief with a brass bell, and grass tufts.
 */
import { useId, type ReactNode } from 'react'

export const C = {
  fur: '#f7ead4',
  furLight: '#fffaf0',
  furShade: '#e8cfac',
  patch: '#e39a55',
  patchDark: '#c4743a',
  ink: '#5b4030',
  eye: '#2e2320',
  blush: '#f2a197',
  nose: '#d9786b',
  earInner: '#f3b7aa',
  scarf: '#c94f3d',
  scarfDark: '#9e3527',
  bell: '#e8c25a',
  grass: '#93b46a',
  grassDark: '#6f9150',
  leaf: '#a9c77a',
  tear: '#8fc3e8',
  screen: '#cfe6f7',
  laptop: '#6d625a',
  laptopDark: '#4a413b',
} as const

/** Unique gradient/clip ids for one Figure instance (companions render several). */
export interface Ids { readonly fur: string; readonly head: string; readonly body: string }

/** @returns ids that are unique within the document. */
export function useIds(): Ids {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return { fur: `wpc-fur-${base}`, head: `wpc-head-${base}`, body: `wpc-body-${base}` }
}

/** Shared gradient definitions; render once per Figure inside its `<svg>`. */
export function Defs({ ids }: { readonly ids: Ids }): ReactNode {
  return (
    <defs>
      <radialGradient id={ids.fur} cx="40%" cy="32%" r="75%">
        <stop offset="0" stopColor={C.furLight} />
        <stop offset=".6" stopColor={C.fur} />
        <stop offset="1" stopColor={C.furShade} />
      </radialGradient>
      <clipPath id={ids.head}><ellipse cx="0" cy="0" rx="18" ry="15.5" /></clipPath>
    </defs>
  )
}

/**
 * A limb or tail: a fur-coloured tube with an ink outline.
 * @param props - path data, colour, and width.
 * @returns the two stacked strokes.
 */
export function Tube({ d, color = C.fur, width = 6 }: { readonly d: string; readonly color?: string; readonly width?: number }): ReactNode {
  return (
    <>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={width + 2.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

export function Ground({ cx = 50, rx = 26 }: { readonly cx?: number; readonly rx?: number }): ReactNode {
  return (
    <g>
      <ellipse cx={cx} cy="73" rx={rx} ry="3.6" fill={C.ink} opacity=".13" />
      <path d="M14 74 q1 -6 3 -8 q-.6 5 1 8 q1 -4 3 -6 q-1 4 0 6 Z" fill={C.grass} />
      <path d="M80 74 q1 -5 2.6 -7 q-.4 4 .8 7 q1.2 -3 3 -5 q-1 3 -.2 5 Z" fill={C.grassDark} />
    </g>
  )
}

export type EyeKind = 'open' | 'up' | 'look' | 'focus' | 'happy' | 'closed' | 'sleepy' | 'wide' | 'spiral' | 'sad'

function Eye({ kind, x }: { readonly kind: EyeKind; readonly x: number }): ReactNode {
  const y = 0
  switch (kind) {
    case 'happy':
      return <path d={`M${x - 3.2} ${y + 1.2} q3.2 -4.4 6.4 0`} fill="none" stroke={C.eye} strokeWidth="1.9" strokeLinecap="round" />
    case 'closed':
      return <path d={`M${x - 3.2} ${y - .4} q3.2 3.4 6.4 0`} fill="none" stroke={C.eye} strokeWidth="1.8" strokeLinecap="round" />
    case 'sleepy':
      return <path d={`M${x - 3.2} ${y + .6} h6.4`} fill="none" stroke={C.eye} strokeWidth="1.8" strokeLinecap="round" />
    case 'spiral':
      return (
        <g className="wpc-spin" style={{ transformOrigin: `${x}px ${y}px` }}>
          <path d={`M${x} ${y} a1.3 1.3 0 1 1 1.3 1.3 a2.6 2.6 0 1 1 2.5 -3.1`} fill="none" stroke={C.eye} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )
    case 'wide':
      return (
        <g>
          <circle cx={x} cy={y} r="3.9" fill={C.eye} />
          <circle cx={x + 1.3} cy={y - 1.5} r="1.4" fill="#fff" />
          <circle cx={x - 1.1} cy={y + 1.6} r=".65" fill="#fff" />
        </g>
      )
    case 'focus':
      return (
        <g>
          <ellipse cx={x} cy={y + .4} rx="2.7" ry="3" fill={C.eye} />
          <circle cx={x + 1} cy={y - .6} r=".9" fill="#fff" />
          <path d={`M${x - 3.6} ${y - 2.2} q3.6 -1.4 7.2 0`} fill="none" stroke={C.ink} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )
    case 'sad':
      return (
        <g>
          <ellipse cx={x} cy={y + .6} rx="2.6" ry="3.1" fill={C.eye} />
          <circle cx={x + .9} cy={y - .5} r=".9" fill="#fff" />
          <path d={x < 0 ? `M${x - 3.4} ${y - 4.2} l6 1.6` : `M${x + 3.4} ${y - 4.2} l-6 1.6`} fill="none" stroke={C.ink} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'up':
    case 'look':
    case 'open':
    default: {
      const dx = kind === 'up' ? .5 : 0
      const dy = kind === 'up' ? -1.1 : 0
      return (
        <g>
          <ellipse cx={x + dx} cy={y + dy} rx="2.9" ry="3.7" fill={C.eye} />
          <circle cx={x + dx + 1.1} cy={y + dy - 1.4} r="1.15" fill="#fff" />
          <circle cx={x + dx - .9} cy={y + dy + 1.5} r=".55" fill="#fff" />
        </g>
      )
    }
  }
}

/** Options of {@link Head}. */
export interface HeadProps {
  readonly ids: Ids
  readonly cx: number
  readonly cy: number
  readonly eyes: EyeKind
  /** Degrees; negative tilts toward the viewer's left. */
  readonly tilt?: number
  readonly mouth?: 'smile' | 'open' | 'flat'
  readonly droop?: boolean
  readonly blush?: 'soft' | 'strong' | 'none'
  readonly tear?: boolean
}

/**
 * The cat's head, centred on (cx, cy).
 * @param props - placement and expression.
 * @returns the head group.
 */
export function Head({ ids, cx, cy, eyes, tilt = 0, mouth = 'smile', droop = false, blush = 'soft', tear = false }: HeadProps): ReactNode {
  const eyeClass = eyes === 'open' || eyes === 'up' ? 'wpc-blink' : eyes === 'look' ? 'wpc-look' : undefined
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${tilt})`}>
      <g transform={droop ? 'rotate(-28 -10 -12)' : undefined}>
        <path d="M-16 -5 L-14 -22 Q-13.5 -24.5 -11.6 -22.8 L-3 -13 Z" fill={C.patch} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M-13.4 -8.5 L-12.6 -19 L-6.8 -12.6 Z" fill={C.earInner} />
      </g>
      <g transform={droop ? 'rotate(28 10 -12)' : undefined}>
        <path d="M16 -5 L14 -22 Q13.5 -24.5 11.6 -22.8 L3 -13 Z" fill={C.fur} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M13.4 -8.5 L12.6 -19 L6.8 -12.6 Z" fill={C.earInner} />
      </g>
      <ellipse cx="0" cy="0" rx="18" ry="15.5" fill={`url(#${ids.fur})`} />
      <g clipPath={`url(#${ids.head})`}>
        <path d="M-19 -1 C-18 -12 -10 -17 -1 -16 C-3 -10 -9 -4 -19 -1 Z" fill={C.patch} opacity=".95" />
        <path d="M2 -15.5 q1.4 3 .4 5.6 M5.5 -14.8 q1.2 2.6 .4 4.8" fill="none" stroke={C.patchDark} strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
      </g>
      <ellipse cx="0" cy="0" rx="18" ry="15.5" fill="none" stroke={C.ink} strokeWidth="1.6" />
      <ellipse cx="0" cy="6.2" rx="7" ry="4.4" fill={C.furLight} opacity=".9" />
      {blush !== 'none' && (
        <g fill={C.blush} opacity={blush === 'strong' ? .9 : .55}>
          <ellipse cx="-11.5" cy="5.6" rx={blush === 'strong' ? 3.8 : 3.2} ry="1.9" />
          <ellipse cx="11.5" cy="5.6" rx={blush === 'strong' ? 3.8 : 3.2} ry="1.9" />
        </g>
      )}
      <g className={eyeClass}>
        <Eye kind={eyes} x={-7} />
        <Eye kind={eyes} x={7} />
      </g>
      {tear && <path d="M10.5 3 q-1.8 3 0 4.2 q1.8 -1.2 0 -4.2 Z" fill={C.tear} className="wpc-drip" />}
      <path d="M-1.7 4.4 Q0 3.8 1.7 4.4 L0 6.2 Z" fill={C.nose} />
      {mouth === 'open'
        ? <path d="M-2.2 7.4 Q0 11.2 2.2 7.4 Q0 8.4 -2.2 7.4 Z" fill="#b8534a" stroke={C.ink} strokeWidth=".8" strokeLinejoin="round" />
        : mouth === 'flat'
          ? <path d="M-2.4 8.2 h4.8" fill="none" stroke={C.ink} strokeWidth="1.1" strokeLinecap="round" />
          : <path d="M0 6.4 q-1.4 1.9 -3 .7 M0 6.4 q1.4 1.9 3 .7" fill="none" stroke={C.ink} strokeWidth="1.1" strokeLinecap="round" />}
      <path d="M-14 4 L-22 2.4 M-14 6.6 L-22 7.6 M14 4 L22 2.4 M14 6.6 L22 7.6" stroke={C.ink} strokeWidth=".8" strokeLinecap="round" opacity=".5" />
    </g>
  )
}

/**
 * Red neckerchief with a brass bell, tied under a head centred at (cx, neckY - 14).
 * @param props - neck centre.
 * @returns the scarf group.
 */
export function Scarf({ cx, y }: { readonly cx: number; readonly y: number }): ReactNode {
  return (
    <g>
      <path d={`M${cx - 12} ${y - 1} Q${cx} ${y + 5} ${cx + 12} ${y - 1} L${cx + 11} ${y + 3} Q${cx} ${y + 8.5} ${cx - 11} ${y + 3} Z`} fill={C.scarf} stroke={C.ink} strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M${cx - 10} ${y + 2.4} Q${cx} ${y + 7} ${cx + 10} ${y + 2.4}`} fill="none" stroke={C.scarfDark} strokeWidth=".9" opacity=".7" />
      <circle cx={cx} cy={y + 7.6} r="2.3" fill={C.bell} stroke={C.ink} strokeWidth=".9" />
      <path d={`M${cx - 1.2} ${y + 8.4} h2.4`} stroke={C.ink} strokeWidth=".7" />
    </g>
  )
}

/** A leaf drifting on the wind (decoration for running). */
export function Leaf({ x, y, delay }: { readonly x: number; readonly y: number; readonly delay: string }): ReactNode {
  return (
    <g className="wpc-leaf" style={{ animationDelay: delay }}>
      <path d={`M${x} ${y} q3 -3.4 6.4 -1 q-3 3.4 -6.4 1 Z`} fill={C.leaf} stroke={C.grassDark} strokeWidth=".6" />
    </g>
  )
}
