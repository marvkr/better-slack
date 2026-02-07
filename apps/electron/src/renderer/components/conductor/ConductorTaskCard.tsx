/**
 * ConductorTaskCard - Clean task card for Better Slack UI.
 * Layout: left side (title + description + date pill), right side (large X and check circles).
 * Subtle border, white bg. Selected state: beige bg + red dot + chevron.
 */

import { cn } from '@/lib/utils'
import { useAtomValue } from 'jotai'
import type { ConductorTask } from '@craft-agent/core/types'
import { activeUserIdAtom } from '@/atoms/conductor'
import { X, Check, Calendar, ChevronRight } from 'lucide-react'

interface ConductorTaskCardProps {
  task: ConductorTask
  isSelected: boolean
  onClick: () => void
  onAccept?: () => void
  onReject?: () => void
}

export function ConductorTaskCard({ task, isSelected, onClick, onAccept, onReject }: ConductorTaskCardProps) {
  const activeUserId = useAtomValue(activeUserIdAtom)
  const isAssignedToMe = task.assigneeId === activeUserId
  const showActions = isAssignedToMe && task.status !== 'completed' && task.status !== 'cancelled'

  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const deadlineStr = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  // Friendly relative deadline label
  const getDeadlineLabel = () => {
    if (!deadlineDate) return null
    const now = new Date()
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays > 1 && diffDays <= 7) {
      const dayName = deadlineDate.toLocaleDateString('en-US', { weekday: 'long' })
      return `Next ${dayName}`
    }
    return deadlineStr
  }

  const deadlineLabel = getDeadlineLabel()

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl cursor-pointer transition-all flex items-center',
        isSelected
          ? 'bg-foreground/[0.04] border border-foreground/[0.06]'
          : 'bg-white border border-foreground/[0.08] hover:border-foreground/[0.12]',
      )}
    >
      {/* Left: text content */}
      <div className="flex-1 min-w-0 px-5 py-4">
        {/* Red dot for selected */}
        {isSelected && (
          <div className="absolute top-3.5 right-3.5 h-2.5 w-2.5 rounded-full bg-destructive" />
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-foreground line-clamp-1">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-foreground/40 line-clamp-1 mt-0.5">
            {task.description}
          </p>
        )}

        {/* Date pill */}
        {deadlineLabel && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-white bg-foreground/80 pl-2.5 pr-3 py-1 rounded-full mt-3">
            <Calendar className="h-3.5 w-3.5" />
            {deadlineLabel}
          </span>
        )}
      </div>

      {/* Right: action buttons or chevron */}
      {isSelected ? (
        <div className="shrink-0 pr-5">
          <ChevronRight className="h-5 w-5 text-foreground/25" />
        </div>
      ) : showActions ? (
        <div className="flex items-center gap-2.5 shrink-0 pr-5">
          <button
            onClick={(e) => { e.stopPropagation(); onReject?.() }}
            className="h-11 w-11 rounded-full bg-foreground/[0.07] flex items-center justify-center text-foreground/70 hover:bg-foreground/[0.12] transition-colors"
            title="Reject"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAccept?.() }}
            className="h-11 w-11 rounded-full bg-success/15 flex items-center justify-center text-success hover:bg-success/25 transition-colors"
            title={task.status === 'in_progress' ? 'Complete' : 'Accept'}
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
