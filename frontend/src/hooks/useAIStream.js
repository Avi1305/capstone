import { useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { invokeAgent } from '../api/ai'
import {
  addMessage,
  setStreaming,
  appendStreamingChunk,
  resetStreamingMessage,
  commitStreamingMessage,
} from '../store/sandboxSlice'
import {
  selectSandboxId,
  selectIsStreaming,
} from '../store/selectors'
import toast from 'react-hot-toast'

/**
 * Hook to send a message and stream the AI response
 */
export function useAIStream() {
  const dispatch = useDispatch()
  const sandboxId = useSelector(selectSandboxId)
  const isStreaming = useSelector(selectIsStreaming)

  const abortControllerRef = useRef(null)

  const sendMessage = useCallback(
    (message) => {
      if (!message.trim() || isStreaming || !sandboxId) return

      // Add user message
      dispatch(addMessage({ role: 'user', content: message }))

      // Start streaming
      dispatch(setStreaming(true))
      dispatch(resetStreamingMessage())

      abortControllerRef.current = invokeAgent(message, sandboxId, {
        onChunk: (chunk) => {
          dispatch(appendStreamingChunk(chunk))
        },
        onDone: () => {
          dispatch(commitStreamingMessage())
        },
        onError: (err) => {
          dispatch(commitStreamingMessage())
          toast.error(`AI error: ${err.message}`)
        },
      })
    },
    [dispatch, sandboxId, isStreaming]
  )

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      dispatch(commitStreamingMessage())
    }
  }, [dispatch])

  return { sendMessage, cancelStream, isStreaming }
}
