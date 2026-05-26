import { Bot } from 'lucide-react'

export function StreamingIndicator({ content }) {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] mt-0.5">
        <Bot size={13} />
      </div>

      {/* Bubble */}
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
        {content ? (
          <div className="whitespace-pre-wrap break-words text-[var(--text-primary)]">
            {content}
            <span className="inline-block w-0.5 h-4 bg-[var(--primary)] ml-0.5 animate-blink align-middle" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="flex gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
            <span className="text-xs">AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  )
}
