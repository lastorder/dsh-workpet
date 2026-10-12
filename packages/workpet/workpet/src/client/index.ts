/**
 * Client half of `dsh-workpet`: provides the `ctx.workpet` Service Definition
 * (the skin registry) and its Consumer UI — one floating pet per registered
 * skin, the Chat probe that feeds them, and the bundle configuration page
 * with the appearance cards and the action preview.
 *
 * @module dsh-workpet/client
 */
import type { ComponentType } from 'react'
import type { WorkpetService } from './contract.ts'
import { createConfigPage } from './config-page.tsx'
import { en, NS, zh, type Translate } from './locale.ts'
import { createOverlay } from './overlay.tsx'
import { createProbe } from './probe.tsx'
import { WorkpetRegistry } from './registry.ts'
import { ChatSignalTable } from './signals.ts'
import { CSS, STYLE_ID } from './styles.ts'

export type * from './contract.ts'

/** npm package name; keys the `plugins.bundle.config` page and the module table entry. */
export const PACKAGE_NAME = 'dsh-workpet'

interface SlotRegistration { readonly name: string; readonly id?: string; readonly key?: string; readonly order?: number; readonly locale?: string; readonly label?: () => string }

/** The part of the Client plugin context this plugin uses. */
export interface WorkpetHostContext {
  provide(name: 'workpet', value: WorkpetService): () => void
  effect(callback: () => () => void, label?: string): () => void
  readonly locale: {
    register(ns: string, dicts: { en: Record<string, string>; zh: Record<string, string> }): () => void
    bind(ns: string): Translate
  }
  readonly slots: {
    inject(slot: string, callback: () => unknown): () => void
    register(options: SlotRegistration, component: ComponentType<never>): unknown
  }
}

/** Client services this plugin waits for. */
export const inject = ['slots', 'locale']

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
 * @param ctx - Client root context.
 */
export function apply(ctx: WorkpetHostContext): void {
  const registry = new WorkpetRegistry()
  const signals = new ChatSignalTable()
  ctx.provide('workpet', registry)
  ctx.effect(insertStyles, 'workpet: stylesheet')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'workpet: dictionaries')
  const t = ctx.locale.bind(NS)

  const Probe = createProbe(signals)
  const Overlay = createOverlay(registry, signals)
  const ConfigPage = createConfigPage(registry)

  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
    name: 'conversation.composer.dock', id: 'workpet-probe', order: 9999,
  }, Probe as ComponentType<never>))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'workpet', order: 9000, locale: NS, label: () => t('overlay.label'),
  }, Overlay as ComponentType<never>))
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
    name: 'plugins.bundle.config', key: PACKAGE_NAME, locale: NS,
  }, ConfigPage as ComponentType<never>))
}
