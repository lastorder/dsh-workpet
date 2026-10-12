/**
 * The pet stage: the skin's Figure plus everything the Consumer draws around
 * it (helper companions, the tool badge, and activity effects), so every skin
 * gets the same affordances. Shared by the overlay and the configuration
 * page preview.
 */
import { Component, type ReactNode } from 'react'
import type { WorkpetScene, WorkpetSkin } from './contract.ts'
import { TOOL_GLYPH } from './scene.ts'

const COMPANION_SCENE: WorkpetScene = { activity: 'tool', tool: { name: 'subagent', category: 'delegate' }, helpers: 0 }

interface BoundaryProps { readonly children: ReactNode }

/**
 * Contains a throwing third-party Figure so one broken skin blanks only the
 * pet, not the slot. Keyed by skin id by its parent, so switching skins resets it.
 */
class FigureBoundary extends Component<BoundaryProps, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override componentDidCatch(error: unknown): void {
    console.error('[dsh-workpet] skin Figure crashed', error)
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}

function Effects({ scene }: { readonly scene: WorkpetScene }): ReactNode {
  switch (scene.activity) {
    case 'sleeping':
      return (
        <>
          <span className="wp-fx wp-fx-z" style={{ left: 68, top: 8, fontSize: 14 }}>z</span>
          <span className="wp-fx wp-fx-z" style={{ left: 80, top: 0, fontSize: 10, animationDelay: '-1.2s' }}>z</span>
        </>
      )
    case 'petted':
      return (
        <>
          <span className="wp-fx wp-fx-heart" style={{ left: 26, top: 4, fontSize: 13 }}>💗</span>
          <span className="wp-fx wp-fx-heart" style={{ left: 56, top: 10, fontSize: 10, animationDelay: '-.45s' }}>💗</span>
          <span className="wp-fx wp-fx-heart" style={{ left: 42, top: -2, fontSize: 9, animationDelay: '-.9s' }}>💗</span>
        </>
      )
    case 'done':
      return (
        <>
          <span className="wp-fx wp-fx-spark" style={{ left: 6, top: 10, fontSize: 14 }}>✨</span>
          <span className="wp-fx wp-fx-spark" style={{ left: 80, top: 16, fontSize: 11, animationDelay: '-.4s' }}>✨</span>
          <span className="wp-fx wp-fx-spark" style={{ left: 46, top: -6, fontSize: 10, animationDelay: '-.7s' }}>✨</span>
        </>
      )
    case 'awaiting': {
      const glyph = scene.awaiting === 'question' ? '?' : scene.awaiting === 'plan-review' ? '≡' : '!'
      return <span className="wp-fx wp-fx-bubble" data-tone="warn" style={{ left: 2, top: -4 }}>{glyph}</span>
    }
    case 'error':
      return <span className="wp-fx wp-fx-bubble" data-tone="error" style={{ left: 2, top: -4 }}>!</span>
    case 'thinking':
      return (
        <span className="wp-fx wp-fx-bubble wp-fx-dots" style={{ left: 2, top: -4 }}>
          <span /><span /><span />
        </span>
      )
    case 'retrying':
      return <span className="wp-fx wp-fx-bubble" data-tone="warn" style={{ left: 2, top: -4 }}>↻</span>
    default:
      return null
  }
}

/** Props of {@link PetStage}. */
export interface PetStageProps {
  readonly skin: WorkpetSkin
  readonly scene: WorkpetScene
  /** Draw helper companions when the scene has running helpers. */
  readonly companions?: boolean
}

/**
 * @param props - skin and scene.
 * @returns the stage content; the caller owns the 100×80 box.
 */
export function PetStage({ skin, scene, companions = true }: PetStageProps): ReactNode {
  const { Figure } = skin
  const helpers = companions ? Math.min(scene.helpers, 2) : 0
  return (
    <FigureBoundary key={skin.id}>
      {helpers > 0 && (
        <div className="wp-companion" data-side="left" aria-hidden="true">
          <Figure scene={COMPANION_SCENE} compact />
        </div>
      )}
      {helpers > 1 && (
        <div className="wp-companion" data-side="right" aria-hidden="true">
          <Figure scene={COMPANION_SCENE} compact />
        </div>
      )}
      <div className="wp-figure"><Figure scene={scene} /></div>
      <div className="wp-effects" aria-hidden="true"><Effects scene={scene} /></div>
      {scene.activity === 'tool' && scene.tool !== undefined && (
        <div className="wp-badge" aria-hidden="true">{TOOL_GLYPH[scene.tool.category]}</div>
      )}
    </FigureBoundary>
  )
}
