import { useRef, useState, useCallback } from 'react'
import { Send, Square, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ChatInput({ onSend, disabled, isStreaming, onCancel }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
    setValue(ta.value)
  }

  const placeholders = [
    'Ask AI to build something amazing...',
    'Describe what you want to create...',
    'Make the UI dark themed with purple...',
    'Add authentication to this app...',
    'Optimize the database queries...',
  ]

  const [placeholderIdx] = useState(() =>
    Math.floor(Math.random() * placeholders.length)
  )

  return (
    <div className="p-3">
      <div
        className={cn(
          'relative flex items-end gap-2 rounded-xl border transition-all duration-200',
          'bg-[var(--bg-elevated)] border-[var(--border-default)]',
          'focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_var(--primary-glow)]',
          disabled && 'opacity-60'
        )}
      >
        {/* Sparkles icon */}
        <div className="flex-shrink-0 pl-3 pb-3 text-[var(--text-muted)]">
          <Sparkles size={15} className={isStreaming ? 'text-[var(--primary)] animate-pulse' : ''} />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={placeholders[placeholderIdx]}
          className={cn(
            'flex-1 resize-none bg-transparent py-3 pr-2 text-sm leading-relaxed',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:outline-none min-h-[44px] max-h-[200px]'
          )}
        />

        {/* Send / Stop button */}
        <div className="flex-shrink-0 pr-2 pb-2">
          {isStreaming ? (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--error-subtle)] text-[var(--error)] hover:bg-[var(--error)] hover:text-white transition-all duration-200"
              title="Stop generation"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                value.trim() && !disabled
                  ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:shadow-[0_0_12px_var(--primary-glow)]'
                  : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] cursor-not-allowed'
              )}
              title="Send message (Enter)"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-[var(--text-disabled)] mt-2">
        <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)] text-[9px]">Enter</kbd>
        {' '}to send · {' '}
        <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)] text-[9px]">Shift+Enter</kbd>
        {' '}for newline
      </p>
    </div>
  )
}
