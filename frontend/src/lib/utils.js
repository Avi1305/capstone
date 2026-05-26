import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names conditionally
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Truncate a string to a max length
 */
export function truncate(str, maxLength = 40) {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

/**
 * Generate a short readable ID from a UUID
 */
export function shortId(uuid) {
  if (!uuid) return ''
  return uuid.split('-')[0]
}

/**
 * Delay utility
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
