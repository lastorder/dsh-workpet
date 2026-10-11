/**
 * Host half of `dsh-workpet`. The capability lives entirely in the Client
 * (`./client`); this Loader row exists so the Client module scan serves the
 * package's browser half and so the row can be switched on and off in the
 * Plugin Manager.
 *
 * @module dsh-workpet
 */

/** Cordis plugin name. */
export const name = 'dsh-workpet'

/** No Host-side behavior. */
export function apply(): void {}
