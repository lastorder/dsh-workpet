/**
 * The bundle's configuration page in the Plugin Manager
 * (`plugins.bundle.config`, keyed by this package name): a card for every
 * registered skin — each one is a pet on screen — and the action preview,
 * whose buttons make every card act out the chosen activity.
 */
import { useState, useSyncExternalStore, type ReactNode } from 'react'
import type { WorkpetScene, WorkpetService, WorkpetSkin, WorkpetToolCategory } from './contract.ts'
import type { Translate } from './locale.ts'
import { statusText, toneOf } from './overlay.tsx'
import { choiceOf, DEFAULT_CHOICE, PREVIEW_GROUPS, previewScene, TOOL_ORDER, type PreviewChoice } from './preview.ts'
import { TOOL_GLYPH } from './scene.ts'
import { PetStage } from './stage.tsx'

/** The project: user guide, screenshots, and source. */
export const REPOSITORY_URL = 'https://github.com/lastorder/dsh-workpet'
/** The cockatiel appearance, offered as the example of another pet and the template for new ones. */
export const PARROT_URL = 'https://github.com/lastorder/dsh-workpet-parrot'

/** Owner props of `plugins.bundle.config` this page reads. */
export interface ConfigPageProps {
  readonly t: Translate
  readonly view?: 'page' | 'summary'
}

interface CardProps {
  readonly skin: WorkpetSkin
  readonly scene: WorkpetScene
  /** Restarts the entrance animation when the previewed action changes. */
  readonly sceneKey: string
  readonly t: Translate
}

function SkinCard({ skin, scene, sceneKey, t }: CardProps): ReactNode {
  const description = skin.description?.()
  return (
    <article className="wp-card" role="listitem" data-skin={skin.id}>
      <div className="wp-card-scene" data-activity={scene.activity}>
        <div className="wp-card-bubble" data-tone={toneOf(scene) ?? ''}>{statusText(t, scene)}</div>
        <div className="wp-card-stage" key={sceneKey}><PetStage skin={skin} scene={scene} /></div>
      </div>
      <div className="wp-card-body">
        <h4>{skin.title()}</h4>
        {description !== undefined && <p>{description}</p>}
      </div>
    </article>
  )
}

interface ChipProps {
  readonly choice: PreviewChoice
  readonly glyph: string
  readonly pressed: boolean
  readonly t: Translate
  readonly onPress: (key: string) => void
}

function Chip({ choice, glyph, pressed, t, onPress }: ChipProps): ReactNode {
  return (
    <button type="button" className="wp-chip" aria-pressed={pressed} data-choice={choice.key} onClick={() => onPress(choice.key)}>
      <span className="wp-chip-glyph" aria-hidden="true">{glyph}</span>
      {t(`preview.${choice.key}`)}
    </button>
  )
}

/** A link the Desktop app opens in the system browser. */
function ExternalLink({ href, className, title, children }: { readonly href: string; readonly className?: string; readonly title?: string; readonly children: ReactNode }): ReactNode {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" title={title}>
      {children}
      <svg className="wp-link-arrow" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
        <path d="M4 2.5h5.5V8M9.5 2.5 3 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

/**
 * Render a translated sentence with one `{placeholder}` replaced by a node.
 * @param text - the sentence, translated with the placeholder kept as `{name}`.
 * @param name - placeholder name.
 * @param node - what to put there.
 * @returns the sentence as React children.
 */
function withNode(text: string, name: string, node: ReactNode): ReactNode {
  const [before, ...rest] = text.split(`{${name}}`)
  return rest.length === 0 ? text : <>{before}{node}{rest.join(`{${name}}`)}</>
}

/**
 * @param workpet - the skin registry.
 * @returns the configuration page component.
 */
export function createConfigPage(workpet: WorkpetService): (props: ConfigPageProps) => ReactNode {
  return function WorkpetConfigPage({ t, view = 'page' }: ConfigPageProps): ReactNode {
    const { skins } = useSyncExternalStore(workpet.subscribe, workpet.getSnapshot, workpet.getSnapshot)
    const [choiceKey, setChoiceKey] = useState(DEFAULT_CHOICE.key)
    const [tool, setTool] = useState<WorkpetToolCategory>('shell')
    if (view !== 'page') return null

    const choice = choiceOf(choiceKey)
    const scene = previewScene(choice, tool)
    const sceneKey = choice.activity === 'tool' ? `${choice.key}:${tool}` : choice.key

    return (
      <section className="wp-config" aria-label={t('config.title')}>
        <header className="wp-config-head">
          <div className="wp-config-title">
            <h3>{t('config.title')}</h3>
            {skins.length > 0 && <span className="wp-config-count">{t('config.count', { n: skins.length })}</span>}
            <ExternalLink className="wp-config-source" href={REPOSITORY_URL} title={t('config.sourceTitle')}>{t('config.source')}</ExternalLink>
          </div>
          <p>{t('config.description')}</p>
        </header>

        <div className="wp-gallery" role="list" aria-label={t('config.gallery')}>
          {skins.map(skin => <SkinCard key={skin.id} skin={skin} scene={scene} sceneKey={sceneKey} t={t} />)}
          <div className="wp-card wp-card-more" role="listitem" data-empty={skins.length === 0 ? 'true' : 'false'}>
            <span className="wp-card-more-glyph" aria-hidden="true">{skins.length === 0 ? '🐾' : '＋'}</span>
            <p>
              {skins.length === 0
                ? t('config.empty')
                : withNode(t('config.more', { example: '{example}' }), 'example', <ExternalLink href={PARROT_URL}>dsh-workpet-parrot</ExternalLink>)}
            </p>
          </div>
        </div>

        {skins.length > 0 && (
          <div className="wp-actions" role="group" aria-label={t('config.actions')}>
            <div className="wp-actions-head">
              <h4>{t('config.actions')}</h4>
              <span>{t('config.actionsHint')}</span>
            </div>
            {PREVIEW_GROUPS.map(group => (
              <div className="wp-chip-group" key={group.id}>
                <span className="wp-chip-group-label">{t(`group.${group.id}`)}</span>
                <div className="wp-chips">
                  {group.choices.map(item => (
                    <Chip
                      key={item.key}
                      choice={item}
                      glyph={item.activity === 'tool' ? TOOL_GLYPH[tool] : item.glyph}
                      pressed={item.key === choice.key}
                      t={t}
                      onPress={setChoiceKey}
                    />
                  ))}
                </div>
              </div>
            ))}
            {choice.activity === 'tool' && (
              <div className="wp-chip-group" data-variant="tool">
                <span className="wp-chip-group-label">{t('config.toolKind')}</span>
                <div className="wp-chips">
                  {TOOL_ORDER.map(category => (
                    <button
                      type="button"
                      key={category}
                      className="wp-chip"
                      data-variant="true"
                      aria-pressed={category === tool}
                      title={t(`tool.${category}`)}
                      aria-label={t(`tool.${category}`)}
                      onClick={() => setTool(category)}
                    >
                      <span className="wp-chip-glyph" aria-hidden="true">{TOOL_GLYPH[category]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    )
  }
}
