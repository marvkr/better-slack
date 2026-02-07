/**
 * DeadlineIndicator - Color-coded countdown for task deadlines.
 * Green → Yellow → Red based on elapsed percentage.
 */

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeadlineIndicatorProps {
  deadline: number
  startedAt?: number
  className?: string
}

function getTimeRemaining(deadline: number): string {
  const diff = deadline - Date.now()
  if (diff <= 0) return 'Overdue'

  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`

  const days = Math.floor(hours / 24)
  return `${days}d`
}

function getProgressColor(deadline: number, startedAt?: number): string {
  if (!startedAt) return 'text-muted-foreground'

  const totalDuration = deadline - startedAt
  const elapsed = Date.now() - startedAt
  const progress = elapsed / totalDuration

  if (progress >= 0.9) return 'text-destructive'
  if (progress >= 0.75) return 'text-orange-500'
  if (progress >= 0.5) return 'text-yellow-500'
  return 'text-green-500'
}

export function DeadlineIndicator({ deadline, startedAt, className }: DeadlineIndicatorProps) {
  const [, setTick] = useState(0)

  // Update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  const remaining = getTimeRemaining(deadline)
  const colorClass = getProgressColor(deadline, startedAt)

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', colorClass, className)}>
      <Clock className="h-3 w-3" />
      {remaining}
    </span>
  )
}
