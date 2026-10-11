/**
 * Invisible probe in `conversation.composer.dock` (Session scope). It reads
 * the Session's Chat target through the standard `useChat` hook and publishes
 * a {@link ChatSignal} for the overlay. It renders nothing.
 */
import { useEffect, type ReactNode } from 'react'
import { chatSignalOf, type ChatLegacySlice } from './scene.ts'
import type { ChatSignalTable } from './signals.ts'

type ChatSnapshotLike = { readonly legacy?: ChatLegacySlice }
type UseChat = <T>(selector: (snapshot: ChatSnapshotLike) => T) => T

/** Session standard props this probe reads. */
export interface ProbeProps {
  readonly sessionId?: string
  readonly useChat?: UseChat
}

const noChat: UseChat = selector => selector({})

/**
 * @param signals - table the probe publishes into.
 * @returns the probe component.
 */
export function createProbe(signals: ChatSignalTable): (props: ProbeProps) => ReactNode {
  return function WorkpetProbe({ sessionId, useChat = noChat }: ProbeProps): ReactNode {
    const nodes = useChat(snapshot => snapshot.legacy?.nodes)
    const partial = useChat(snapshot => snapshot.legacy?.partial)
    const runningCalls = useChat(snapshot => snapshot.legacy?.runningCalls)
    useEffect(() => sessionId === undefined ? undefined : signals.retain(sessionId), [sessionId])
    useEffect(() => {
      if (sessionId === undefined) return
      signals.publish(sessionId, chatSignalOf({ nodes, partial, runningCalls }))
    }, [sessionId, nodes, partial, runningCalls])
    return null
  }
}
