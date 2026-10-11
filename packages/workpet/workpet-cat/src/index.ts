/**
 * Host half of `dsh-workpet-cat`. The skin lives in the Client (`./client`);
 * this Loader row only lets the Client module scan serve it.
 *
 * @module dsh-workpet-cat
 */

/** Cordis plugin name. */
export const name = 'dsh-workpet-cat'

/** No Host-side behavior. */
export function apply(): void {}
