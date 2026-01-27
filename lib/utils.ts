import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    opened: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    clicked: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    bounced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    complained: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    suppressed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  }
  return colors[status] || colors.queued
}

export function getLanguageFlag(language: string): string {
  return language === 'fr' ? '🇫🇷' : '🇳🇱'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}
