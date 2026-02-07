/**
 * FeedbackButtons - Thumbs up/down + kudos for completed tasks.
 */

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskFeedback } from '@craft-agent/core/types'

interface FeedbackButtonsProps {
  feedback?: TaskFeedback
  showKudos?: boolean
  onSubmit: (feedback: TaskFeedback) => void
  className?: string
}

export function FeedbackButtons({ feedback, showKudos = false, onSubmit, className }: FeedbackButtonsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={() => onSubmit({ ...feedback, quality: feedback?.quality === 'thumbs_up' ? undefined : 'thumbs_up' })}
        onMouseEnter={() => setHoveredButton('up')}
        onMouseLeave={() => setHoveredButton(null)}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          feedback?.quality === 'thumbs_up'
            ? 'bg-green-500/20 text-green-500'
            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
        )}
      >
        <ThumbsUp className={cn('h-4 w-4', hoveredButton === 'up' && 'scale-110')} />
      </button>

      <button
        onClick={() => onSubmit({ ...feedback, quality: feedback?.quality === 'thumbs_down' ? undefined : 'thumbs_down' })}
        onMouseEnter={() => setHoveredButton('down')}
        onMouseLeave={() => setHoveredButton(null)}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          feedback?.quality === 'thumbs_down'
            ? 'bg-destructive/20 text-destructive'
            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
        )}
      >
        <ThumbsDown className={cn('h-4 w-4', hoveredButton === 'down' && 'scale-110')} />
      </button>

      {showKudos && (
        <button
          onClick={() => onSubmit({ ...feedback, kudos: !feedback?.kudos })}
          onMouseEnter={() => setHoveredButton('kudos')}
          onMouseLeave={() => setHoveredButton(null)}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            feedback?.kudos
              ? 'bg-pink-500/20 text-pink-500'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          )}
        >
          <Heart className={cn('h-4 w-4', feedback?.kudos && 'fill-current', hoveredButton === 'kudos' && 'scale-110')} />
        </button>
      )}
    </div>
  )
}
