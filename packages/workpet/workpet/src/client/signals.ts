/**
 * Per-Session Chat signals, written by every mounted composer-dock probe and
 * read by the overlay for the main-view Session. A Session's entry lives while
 * at least one probe for it is mounted.
 */
import { sameSignal, type ChatSignal } from './scene.ts'

interface Entry { signal: ChatSignal | undefined; refs: number }

/** Reference-counted signal table with one change subscription. */
export class ChatSignalTable {
  private readonly entries = new Map<string, Entry>()
  private readonly listeners = new Set<() => void>()

  /**
   * Hold the Session's entry while a probe is mounted.
   * @param sessionId - probed Session.
   * @returns release callback.
   */
  retain(sessionId: string): () => void {
    const entry = this.entries.get(sessionId)
    if (entry === undefined) this.entries.set(sessionId, { signal: undefined, refs: 1 })
    else entry.refs += 1
    let held = true
    return () => {
      if (!held) return
      held = false
      const current = this.entries.get(sessionId)
      if (current === undefined) return
      current.refs -= 1
      if (current.refs <= 0) {
        this.entries.delete(sessionId)
        this.notify()
      }
    }
  }

  /**
   * @param sessionId - probed Session; ignored unless retained.
   * @param signal - latest signal.
   */
  publish(sessionId: string, signal: ChatSignal): void {
    const entry = this.entries.get(sessionId)
    if (entry === undefined || sameSignal(entry.signal, signal)) return
    entry.signal = signal
    this.notify()
  }

  /** @param sessionId - Session to read. @returns its latest signal. */
  read(sessionId: string | undefined): ChatSignal | undefined {
    return sessionId === undefined ? undefined : this.entries.get(sessionId)?.signal
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener()
  }
}
