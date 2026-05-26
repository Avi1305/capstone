import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '../../lib/utils'
import { Bot, User, Copy, Check } from 'lucide-react'
import { useState } from 'react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--bg-overlay)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-strong)] transition-all duration-150 opacity-0 group-hover:opacity-100"
      title="Copy code"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '')
  const codeString = String(children).replace(/\n$/, '')

  if (!inline && match) {
    return (
      <div className="relative group my-3">
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-t-lg">
          <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
            {match[1]}
          </span>
          <CopyButton text={codeString} />
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0 0 8px 8px',
            border: '1px solid var(--border-default)',
            borderTop: 'none',
            background: 'hsl(220, 14%, 6%)',
            fontSize: '0.82rem',
            fontFamily: "'JetBrains Mono', monospace",
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <code
      className="px-1.5 py-0.5 rounded text-[var(--primary)] bg-[var(--bg-overlay)] border border-[var(--border-subtle)] font-mono text-[0.83em]"
      {...props}
    >
      {children}
    </code>
  )
}

export function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5',
          isUser
            ? 'bg-[var(--primary)] text-white'
            : 'bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]'
        )}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-[var(--primary)] text-white rounded-tr-sm'
            : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ code: CodeBlock }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
