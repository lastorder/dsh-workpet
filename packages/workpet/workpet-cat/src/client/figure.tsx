/**
 * The cat's poses. One pose per group of activities; every pose draws into
 * `viewBox="0 0 100 80"` and leaves effects (hearts, `z`, badges) to the
 * workpet Consumer.
 */
import type { ReactNode } from 'react'
import type { WorkpetFigureProps, WorkpetScene } from 'dsh-workpet/contract'
import { C, Defs, Ground, Head, Leaf, Scarf, Tube, useIds, type EyeKind, type HeadProps, type Ids } from './parts.tsx'

type Expression = Omit<HeadProps, 'ids' | 'cx' | 'cy'>

/** Whole-figure motions pivot on the ground point under the cat. */
const ORIGIN = { transformOrigin: '50px 72px' }

function Sitting({ ids, face, tail = 'sway', paws = 'both', motion, front }: {
  readonly ids: Ids
  readonly face: Expression
  readonly tail?: 'sway' | 'still' | 'flick'
  readonly paws?: 'both' | 'left'
  /** Whole-body motion class; the ground stays put. */
  readonly motion?: string
  /** Drawn over the head, e.g. a raised paw. */
  readonly front?: ReactNode
}): ReactNode {
  const tailClass = tail === 'sway' ? 'wpc-tail' : tail === 'flick' ? 'wpc-tail-flick' : undefined
  return (
    <>
      <Ground />
      <g className={motion} style={ORIGIN}>
        <g className="wpc-breathe" style={ORIGIN}>
          <g className={tailClass} style={{ transformOrigin: '63px 67px' }}>
            <Tube d="M63 67 C79 70 86 58 81 48 C78 42 72 43 74 48" width={5.5} />
            <Tube d="M80.6 47 C78.6 42.6 73.4 43 74 48" color={C.patch} width={5.5} />
          </g>
          <path d="M35 70 C30 58 34 45 50 43 C66 45 70 58 65 70 Q50 73 35 70 Z" fill={`url(#${ids.fur})`} stroke={C.ink} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M61.5 48.5 C67 53 68 62 65.6 69.4 L61.4 70 C62.6 62 61.6 54.4 58 50 Z" fill={C.patch} opacity=".95" />
          <ellipse cx="50" cy="58.5" rx="7.5" ry="9" fill={C.furLight} opacity=".9" />
          <ellipse cx="44" cy="70" rx="5" ry="3.2" fill={C.fur} stroke={C.ink} strokeWidth="1.3" />
          {paws === 'both' && <ellipse cx="56" cy="70" rx="5" ry="3.2" fill={C.fur} stroke={C.ink} strokeWidth="1.3" />}
          <Scarf cx={50} y={42} />
          <Head ids={ids} cx={50} cy={29} {...face} />
          {front}
        </g>
      </g>
    </>
  )
}

function Running({ ids, eyes, scenery }: { readonly ids: Ids; readonly eyes: EyeKind; readonly scenery: boolean }): ReactNode {
  return (
    <>
      {scenery && <Ground cx={48} rx={28} />}
      <g className="wpc-bob">
        <g className="wpc-tail-run" style={{ transformOrigin: '30px 48px' }}>
          <Tube d="M30 48 C20 46 14 38 17 30" width={5} />
          <Tube d="M17.6 33.4 C16.8 32 16.7 31 17 30" color={C.patch} width={5} />
        </g>
        <g className="wpc-leg-b" style={{ transformOrigin: '36px 55px' }}><Tube d="M36 55 L33 67" color={C.furShade} width={5} /></g>
        <g className="wpc-leg-a" style={{ transformOrigin: '58px 55px' }}><Tube d="M58 55 L61 67" color={C.furShade} width={5} /></g>
        <ellipse cx="46" cy="50" rx="19" ry="10.5" fill={`url(#${ids.fur})`} />
        <path d="M31 46 C34 40 44 38 52 40 C48 44 40 47 31 46 Z" fill={C.patch} opacity=".95" />
        <ellipse cx="46" cy="50" rx="19" ry="10.5" fill="none" stroke={C.ink} strokeWidth="1.6" />
        <g className="wpc-leg-a" style={{ transformOrigin: '38px 56px' }}><Tube d="M38 56 L36 68" width={5} /></g>
        <g className="wpc-leg-b" style={{ transformOrigin: '56px 56px' }}><Tube d="M56 56 L58 68" width={5} /></g>
        <g className="wpc-flutter" style={{ transformOrigin: '56px 45px' }}>
          <path d="M57 44 L45 40 L47.5 46 Z" fill={C.scarf} stroke={C.ink} strokeWidth="1" strokeLinejoin="round" />
        </g>
        <Scarf cx={65} y={46} />
        <Head ids={ids} cx={66} cy={33} eyes={eyes} />
      </g>
      {scenery && (
        <>
          <Leaf x={8} y={28} delay="0s" />
          <Leaf x={4} y={46} delay="-.9s" />
          <Leaf x={12} y={60} delay="-1.7s" />
        </>
      )}
    </>
  )
}

function Sleeping({ ids }: { readonly ids: Ids }): ReactNode {
  return (
    <>
      <Ground rx={30} />
      <g className="wpc-breathe-slow" style={{ transformOrigin: '50px 72px' }}>
        <path d="M24 70 C20 56 34 44 52 44 C70 44 80 56 76 70 Q50 74 24 70 Z" fill={`url(#${ids.fur})`} stroke={C.ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M56 45.4 C68 46.4 75.6 54 76.6 62 C70 57.6 62 52 54 50 Z" fill={C.patch} opacity=".95" />
        <Tube d="M75 64 C80 72 58 74.5 38 71.5" width={5.5} />
        <Tube d="M44 72.4 C41 72.2 39.4 71.9 38 71.5" color={C.patch} width={5.5} />
        <ellipse cx="42" cy="69" rx="5" ry="3" fill={C.fur} stroke={C.ink} strokeWidth="1.2" />
        <g transform="translate(34 55) scale(.86) translate(-34 -55)">
          <Head ids={ids} cx={34} cy={55} eyes="closed" tilt={-14} blush="soft" />
        </g>
      </g>
    </>
  )
}

function Typing({ ids }: { readonly ids: Ids }): ReactNode {
  return (
    <>
      <Sitting ids={ids} face={{ eyes: 'focus', tilt: 7 }} tail="flick" paws="left" />
      <g>
        <path d="M58 68 L90 68 L86 72 L60 72 Z" fill={C.laptopDark} stroke={C.ink} strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M64 67.5 L68 48 L91 48 L87 67.5 Z" fill={C.laptop} stroke={C.ink} strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M66.4 65.5 L69.6 50 L88.6 50 L85.4 65.5 Z" fill={C.screen} className="wpc-glow" />
        <g strokeWidth="1.3" strokeLinecap="round">
          <path className="wpc-code" d="M71 54 h8" stroke="#7aa2c8" />
          <path className="wpc-code" d="M70.2 57.6 h11" stroke="#9cbf74" style={{ animationDelay: '-.5s' }} />
          <path className="wpc-code" d="M69.4 61.2 h6" stroke="#e39a55" style={{ animationDelay: '-1s' }} />
        </g>
      </g>
      <g className="wpc-type" style={{ transformOrigin: '58px 55px' }}>
        <Tube d="M58 55 Q62 62 66 66" width={5} />
      </g>
      <g className="wpc-type" style={{ transformOrigin: '52px 58px', animationDelay: '-.11s' }}>
        <Tube d="M53 60 Q57 65 61 67.5" width={4.6} />
      </g>
    </>
  )
}

function Waving({ ids, motion }: { readonly ids: Ids; readonly motion?: string }): ReactNode {
  const paw = (
    <g className="wpc-wave" style={{ transformOrigin: '61px 53px' }}>
      <Tube d="M61 53 Q71 47 75 35" width={5.5} />
      <circle cx="75.6" cy="33.2" r="3.8" fill={C.fur} stroke={C.ink} strokeWidth="1.3" />
      <path d="M74.2 31.6 v2.4 M76.9 31.6 v2.4" stroke={C.earInner} strokeWidth="1" strokeLinecap="round" />
    </g>
  )
  return <Sitting ids={ids} face={{ eyes: 'wide', mouth: 'open' }} tail="flick" paws="left" motion={motion} front={paw} />
}

function Dangling({ ids }: { readonly ids: Ids }): ReactNode {
  return (
    <g className="wpc-swing" style={{ transformOrigin: '50px 2px' }}>
      <g className="wpc-kick" style={{ transformOrigin: '54px 64px' }}>
        <Tube d="M54 64 C60 74 67 70 64 61" width={5} />
      </g>
      <g className="wpc-kick" style={{ transformOrigin: '46px 62px', animationDelay: '-.2s' }}><Tube d="M46 62 L44.5 75" color={C.furShade} width={5} /></g>
      <g className="wpc-kick" style={{ transformOrigin: '54px 62px', animationDelay: '-.35s' }}><Tube d="M54 62 L55.5 75" color={C.furShade} width={5} /></g>
      <ellipse cx="50" cy="51" rx="11.5" ry="15" fill={`url(#${ids.fur})`} stroke={C.ink} strokeWidth="1.6" />
      <ellipse cx="50" cy="53" rx="5.5" ry="9" fill={C.furLight} opacity=".9" />
      <Tube d="M41 45 L37 56" width={4.6} />
      <Tube d="M59 45 L63 56" width={4.6} />
      <Scarf cx={50} y={36} />
      <Head ids={ids} cx={50} cy={23} eyes="wide" mouth="open" blush="strong" />
    </g>
  )
}

/**
 * Pick the pose for one scene.
 * @param scene - derived scene.
 * @param ids - unique ids for this instance.
 * @param compact - companion or preview rendering.
 * @returns pose content.
 */
function pose(scene: WorkpetScene, ids: Ids, compact: boolean): ReactNode {
  switch (scene.activity) {
    case 'absent':
      return <Sitting ids={ids} face={{ eyes: 'closed' }} tail="still" />
    case 'sleeping':
      return <Sleeping ids={ids} />
    case 'thinking':
      return <Sitting ids={ids} face={{ eyes: 'up', tilt: -9, mouth: 'flat' }} tail="flick" motion="wpc-ponder" />
    case 'writing':
      return <Typing ids={ids} />
    case 'tool':
      return <Running ids={ids} eyes="focus" scenery={!compact} />
    case 'retrying':
      return <Sitting ids={ids} face={{ eyes: 'spiral', mouth: 'flat', blush: 'none' }} tail="still" motion="wpc-wobble" />
    case 'awaiting':
      return <Waving ids={ids} motion="wpc-nudge" />
    case 'delegating':
      return <Sitting ids={ids} face={{ eyes: 'look' }} tail="sway" />
    case 'done':
      return <Sitting ids={ids} face={{ eyes: 'happy', mouth: 'open', blush: 'strong' }} tail="flick" motion="wpc-jump" />
    case 'error':
      return <Sitting ids={ids} face={{ eyes: 'sad', mouth: 'flat', droop: true, blush: 'none', tear: true }} tail="still" motion="wpc-shake" />
    case 'petted':
      return <Sitting ids={ids} face={{ eyes: 'happy', blush: 'strong', tilt: 6 }} tail="sway" motion="wpc-purr" />
    case 'dragged':
      return <Dangling ids={ids} />
    case 'idle':
    default:
      return <Sitting ids={ids} face={{ eyes: 'open' }} tail="sway" />
  }
}

/**
 * The cat's Figure.
 * @param props - scene and compact flag.
 * @returns the drawing.
 */
export function CatFigure({ scene, compact = false }: WorkpetFigureProps): ReactNode {
  const ids = useIds()
  return (
    <svg className="wpc" viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true">
      <Defs ids={ids} />
      {pose(scene, ids, compact)}
    </svg>
  )
}
