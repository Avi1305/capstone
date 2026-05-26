import { cn } from '../../lib/utils'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className,
  type = 'button',
  ...props
}) {
  const base = `
    inline-flex items-center justify-center gap-2 font-medium
    rounded-lg transition-all duration-200 cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]
    disabled:opacity-50 disabled:cursor-not-allowed select-none
  `

  const variants = {
    primary: `
      bg-[var(--primary)] text-white
      hover:bg-[var(--primary-hover)] hover:shadow-[0_0_20px_var(--primary-glow)]
      focus:ring-[var(--primary)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]
      hover:bg-[var(--bg-overlay)] hover:border-[var(--border-strong)]
      focus:ring-[var(--border-strong)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-[var(--text-secondary)]
      hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
      focus:ring-[var(--border-strong)]
      active:scale-[0.98]
    `,
    danger: `
      bg-[var(--error)] text-white
      hover:opacity-90 hover:shadow-[0_0_20px_var(--error-subtle)]
      focus:ring-[var(--error)]
      active:scale-[0.98]
    `,
    outline: `
      bg-transparent text-[var(--primary)] border border-[var(--primary)]
      hover:bg-[var(--primary-subtle)]
      focus:ring-[var(--primary)]
      active:scale-[0.98]
    `,
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs h-6',
    sm: 'px-3 py-1.5 text-xs h-7',
    md: 'px-4 py-2 text-sm h-9',
    lg: 'px-6 py-3 text-base h-11',
    xl: 'px-8 py-4 text-lg h-14',
    icon: 'w-8 h-8 p-0',
    'icon-sm': 'w-7 h-7 p-0',
    'icon-lg': 'w-10 h-10 p-0',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
