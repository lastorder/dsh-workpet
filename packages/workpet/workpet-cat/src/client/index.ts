/**
 * Client half of `dsh-workpet-cat`: registers the default workpet skin, a
 * cream-and-ginger cat with a red neckerchief drawn in a soft, hand-painted
 * picture-book style.
 *
 * @module dsh-workpet-cat/client
 */
import type { WorkpetProviderContext, WorkpetSkin } from 'dsh-workpet/contract'
import { CatFigure } from './figure.tsx'
import { CSS, STYLE_ID } from './styles.ts'

const NS = 'workpetCat'
const PACKAGE_NAME = 'dsh-workpet-cat'

const zh = {
  title: '橘白小猫（默认）',
  description: '系着红色小围巾的橘白小猫，手绘绘本画风。',
}
const en = {
  title: 'Ginger Kitten (default)',
  description: 'A cream-and-ginger kitten with a red neckerchief, drawn in a soft hand-painted picture-book style.',
}

/** The capability this provider registers into, plus locale. */
export const inject = ['workpet', 'locale']

function insertStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = PACKAGE_NAME
  tag.dataset.pluginCss = STYLE_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => { tag.remove() }
}

/**
 * Plugin body.
 * @param ctx - Client context with the workpet capability.
 */
export function apply(ctx: WorkpetProviderContext): void {
  ctx.effect(insertStyles, 'workpet-cat: stylesheet')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workpet-cat: dictionaries')
  const t = ctx.locale.bind(NS)
  const skin: WorkpetSkin = {
    id: 'cat',
    order: 0,
    title: () => t('title'),
    description: () => t('description'),
    Figure: CatFigure,
  }
  ctx.effect(() => ctx.workpet.register(skin), 'workpet-cat: skin')
}
