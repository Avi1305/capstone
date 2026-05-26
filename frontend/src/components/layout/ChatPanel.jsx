import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { MessageSquare, Trash2 } from 'lucide-react'
import { setSandboxReady, clearMessages } from '../../store/sandboxSlice'
import {
  selectMessages,
  selectIsStreaming,
  selectStreamingMessage,
  selectSandboxId,
  selectPreviewUrl,
} from '../../store/selectors'
import { useAIStream } from '../../hooks/useAIStream'
import { ChatMessage } from '../chat/ChatMessage'
import { ChatInput } from '../chat/ChatInput'
import { StreamingIndicator } from '../chat/StreamingIndicator'

export function ChatPanel() {
  const dispatch = useDispatch()
  const messages = useSelector(selectMessages)
  const isStreaming = useSelector(selectIsStreaming)
  const streamingMessage = useSelector(selectStreamingMessage)
  const sandboxId = useSelector(selectSandboxId)
  const previewUrl = useSelector(selectPreviewUrl)

  const { sendMessage, cancelStream } = useAIStream()
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new messages or streaming chunks
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  const handleClearMessages = () => {
    // Re-set sandbox state but keep sandboxId/previewUrl
    dispatch(setSandboxReady({ sandboxId, previewUrl }))
    dispatch(clearMessages())
  }

  return (
    <div
      style={{
        height: '100%', width: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-[var(--primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">AI Chat</span>
          {messages.length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded-full border border-[var(--border-subtle)]">
              {messages.length}
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearMessages}
            className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--error-subtle)]"
            title="Clear chat"
          >
            <Trash2 size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'var(--primary-subtle)',
                border: '1px solid var(--primary-glow)',
              }}
            >
              <MessageSquare size={24} className="text-[var(--primary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              AI is ready
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
              Describe what you want to build or change. The AI will generate, edit, and update your sandbox in real-time.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-xs">
              {[
                'Make the UI dark themed with purple',
                'Add a login page with JWT auth',
                'Create a REST API endpoint',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--primary-glow)] hover:text-[var(--primary)] hover:bg-[var(--primary-subtle)] transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isStreaming && (
              <StreamingIndicator content={streamingMessage} />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <ChatInput
          onSend={sendMessage}
          onCancel={cancelStream}
          isStreaming={isStreaming}
          disabled={false}
        />
      </div>
    </div>
  )
}
