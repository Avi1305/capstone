import { cn } from '../../lib/utils'

export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-3 h-3 border',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-[3px]',
  }

  return (
    <div
      className={cn(
        'rounded-full border-current border-t-transparent animate-spin',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
