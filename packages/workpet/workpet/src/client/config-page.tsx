/**
 * The bundle's configuration page in the Plugin Manager
 * (`plugins.bundle.config`, keyed by this package name): the pet appearance
 * dropdown listing every registered skin, and a live preview.
 */
import { useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { WorkpetActivity, WorkpetScene, WorkpetService } from './contract.ts'
import type { Translate } from './locale.ts'
import { statusText } from './overlay.tsx'
import { PetStage } from './stage.tsx'

/** Owner props of `plugins.bundle.config` this page reads. */
export interface ConfigPageProps {
  readonly t: Translate
  readonly view?: 'page' | 'summary'
}

const PREVIEW_SCENES: Record<WorkpetActivity, WorkpetScene> = {
  absent: { activity: 'absent', helpers: 0 },
  idle: { activity: 'idle', helpers: 0 },
  sleeping: { activity: 'sleeping', helpers: 0 },
  thinking: { activity: 'thinking', helpers: 0 },
  writing: { activity: 'writing', helpers: 0 },
  tool: { activity: 'tool', tool: { name: 'bash', category: 'shell' }, helpers: 0 },
  retrying: { activity: 'retrying', helpers: 0 },
  awaiting: { activity: 'awaiting', awaiting: 'approval', helpers: 0 },
  delegating: { activity: 'delegating', helpers: 2 },
  done: { activity: 'done', helpers: 0 },
  error: { activity: 'error', helpers: 0 },
  petted: { activity: 'petted', helpers: 0 },
  dragged: { activity: 'dragged', helpers: 0 },
}

const PREVIEW_ORDER = Object.keys(PREVIEW_SCENES) as WorkpetActivity[]

/**
 * @param workpet - the skin registry.
 * @returns the configuration page component.
 */
export function createConfigPage(workpet: WorkpetService): (props: ConfigPageProps) => ReactNode {
  return function WorkpetConfigPage({ t, view = 'page' }: ConfigPageProps): ReactNode {
    const snapshot = useSyncExternalStore(workpet.subscribe, workpet.getSnapshot, workpet.getSnapshot)
    const [preview, setPreview] = useState<WorkpetActivity>('idle')
    const skinField = useId()
    const previewField = useId()
    if (view !== 'page') return null

    const { skins, current, selectedId } = snapshot
    const missing = selectedId !== undefined && current !== undefined && current.id !== selectedId
    const scene = PREVIEW_SCENES[preview]

    return (
      <section className="wp-config" aria-label={t('config.title')}>
        <div className="wp-config-head">
          <h3>{t('config.title')}</h3>
          <p>{t('config.description')}</p>
        </div>
        {current === undefined
          ? <p className="wp-config-empty">{t('config.empty')}</p>
          : (
            <div className="wp-config-card">
              <div className="wp-config-fields">
                <div className="wp-config-field">
                  <label htmlFor={skinField}>{t('config.skin')}</label>
                  <select id={skinField} value={current.id} onChange={event => workpet.select(event.currentTarget.value)}>
                    {skins.map(skin => <option key={skin.id} value={skin.id}>{skin.title()}</option>)}
                  </select>
                  {current.description !== undefined && <p>{current.description()}</p>}
                  {missing && <p data-tone="warn">{t('config.missing', { id: selectedId, fallback: current.title() })}</p>}
                  <p>{t('config.count', { n: skins.length })}</p>
                </div>
                <div className="wp-config-field">
                  <label htmlFor={previewField}>{t('config.preview')}</label>
                  <select id={previewField} value={preview} onChange={event => setPreview(event.currentTarget.value as WorkpetActivity)}>
                    {PREVIEW_ORDER.map(activity => (
                      <option key={activity} value={activity}>{statusText(t, PREVIEW_SCENES[activity])}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="wp-config-preview">
                <div className="wp-config-stage" data-activity={scene.activity}>
                  <PetStage skin={current} scene={scene} />
                </div>
              </div>
            </div>
          )}
      </section>
    )
  }
}
