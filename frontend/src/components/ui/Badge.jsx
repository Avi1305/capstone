import { cn } from '../../lib/utils'

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-[var(--bg-overlay)] text-[var(--text-secondary)] border-[var(--border-default)]',
    primary: 'bg-[var(--primary-subtle)] text-[var(--primary)] border-[var(--primary-glow)]',
    success: 'bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success-subtle)]',
    warning: 'bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--warning-subtle)]',
    error: 'bg-[var(--error-subtle)] text-[var(--error)] border-[var(--error-subtle)]',
    pulse: 'bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success-subtle)]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {variant === 'pulse' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--success)]" />
        </span>
      )}
      {children}
    </span>
  )
}
