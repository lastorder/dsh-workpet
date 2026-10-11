/**
 * Test harness for built Client halves: loads a `lib/client.js` classic script
 * the way the DSH module table does (a `window.__ModuleLoader__.load` call
 * whose factory receives `require`), and provides a minimal Client context
 * that records services, slot registrations, and locale dictionaries.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
export const React = require('react')
export const ReactDOMServer = require('react-dom/server')
const modules = { react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'react-dom': require('react-dom') }

/**
 * @param {string} file - absolute path of a built `lib/client.js`.
 * @returns {{ id: string, exports: any }} the factory id and its exports.
 */
export function loadClientBundle(file) {
  let registration
  const window = {
    innerWidth: 1280,
    innerHeight: 800,
    addEventListener() {},
    removeEventListener() {},
    __ModuleLoader__: { load: entry => { registration = entry } },
  }
  // Same realm as React, with `window` bound to the fake page object.
  new Function('window', readFileSync(file, 'utf8'))(window)
  if (registration === undefined) throw new Error(`${file} did not call window.__ModuleLoader__.load`)
  const exports = registration.factory(specifier => {
    if (!(specifier in modules)) throw new Error(`unexpected require(${JSON.stringify(specifier)})`)
    return modules[specifier]
  })
  return { id: registration.id, exports }
}

function format(template, params) {
  return params === undefined ? template : template.replace(/\{(\w+)\}/g, (match, key) => key in params ? String(params[key]) : match)
}

/**
 * A minimal Client runtime shared by several plugins.
 * @param {'en' | 'zh'} [language] - dictionary used by `bind`.
 */
export function createRuntime(language = 'en') {
  const services = new Map()
  const slots = new Map()
  const dicts = new Map()
  const disposers = []
  const locale = {
    register(ns, value) { dicts.set(ns, value); return () => dicts.delete(ns) },
    bind(ns) { return (key, params) => format(dicts.get(ns)?.[language]?.[key] ?? key, params) },
  }
  const ctx = new Proxy({
    provide(name, value) { services.set(name, value); return () => services.delete(name) },
    effect(callback) { const dispose = callback(); disposers.push(dispose); return dispose },
    locale,
    slots: {
      inject(name, callback) {
        const list = slots.get(name) ?? []
        list.push(callback())
        slots.set(name, list)
        return () => {}
      },
      register(options, component) { return { options, component } },
    },
  }, {
    get(target, key) { return key in target ? target[key] : services.get(key) },
  })
  return {
    ctx,
    services,
    /** @param {string} name - slot name. @returns {any[]} registrations. */
    slot: name => slots.get(name) ?? [],
    t: ns => locale.bind(ns),
    dispose() { for (const dispose of disposers.splice(0).reverse()) dispose?.() },
  }
}

/**
 * @param {any} component - React component.
 * @param {object} props - props.
 * @returns {string} static markup.
 */
export function render(component, props) {
  return ReactDOMServer.renderToStaticMarkup(React.createElement(component, props))
}
