const BASE_URL = 'http://localhost'

/**
 * Invoke the AI agent with SSE streaming
 * @param {string} message - User message
 * @param {string} projectId - Sandbox/project ID
 * @param {function} onChunk - Called for each streamed text chunk
 * @param {function} onDone - Called when stream completes
 * @param {function} onError - Called on error
 * @returns {AbortController} - Call .abort() to cancel the stream
 */
export function invokeAgent(message, projectId, { onChunk, onDone, onError }) {
  const controller = new AbortController()

  const run = async () => {
    try {
      const response = await fetch(`/api/ai/agent/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ message, projectId }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `AI agent error (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process SSE lines
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed.startsWith('data:')) {
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') {
              onDone?.()
              return
            }
            try {
              // Try parsing as JSON first
              const parsed = JSON.parse(data)
              const text = parsed.text || parsed.content || parsed.message || JSON.stringify(parsed)
              onChunk?.(text)
            } catch {
              // Plain text chunk
              if (data) onChunk?.(data + '\n')
            }
          } else if (trimmed && !trimmed.startsWith(':')) {
            // Non-SSE plain text line
            onChunk?.(trimmed + '\n')
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        onChunk?.(buffer.trim() + '\n')
      }

      onDone?.()
    } catch (err) {
      if (err.name === 'AbortError') return
      onError?.(err)
    }
  }

  run()
  return controller
}
