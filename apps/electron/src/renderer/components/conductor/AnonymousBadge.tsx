/**
 * AnonymousBadge - Shows "Anonymous" placeholder or reveals requester identity.
 */

import { cn } from '@/lib/utils'
import { EyeOff, Eye } from 'lucide-react'

interface AnonymousBadgeProps {
  isAnonymous: boolean
  requesterRevealed: boolean
  requesterName?: string
  className?: string
}

export function AnonymousBadge({
  isAnonymous,
  requesterRevealed,
  requesterName,
  className,
}: AnonymousBadgeProps) {
  if (!isAnonymous || requesterRevealed) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
        <Eye className="h-3 w-3" />
        {requesterName ?? 'Unknown'}
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs text-muted-foreground/70 italic',
      className,
    )}>
      <EyeOff className="h-3 w-3" />
      Anonymous
    </span>
  )
}
