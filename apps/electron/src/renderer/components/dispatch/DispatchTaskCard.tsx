/**
 * DispatchTaskCard - Clean task card for Better Slack UI.
 * Layout: left side (title + description + date pill), right side (large X and check circles).
 * Subtle border, white bg. Selected state: beige bg + red dot + chevron.
 */

import { cn } from '@/lib/utils'
import { useAtomValue } from 'jotai'
import type { DispatchTask } from '@craft-agent/core/types'
import { activeUserIdAtom } from '@/atoms/dispatch'
import { X, Check, Calendar, ChevronRight } from 'lucide-react'

interface DispatchTaskCardProps {
  task: DispatchTask
  isSelected: boolean
  onClick: () => void
  onAccept?: () => void
  onReject?: () => void
  onDateChange?: (taskId: string, newDeadline: number) => void
  isSentByMe?: boolean
}

export function DispatchTaskCard({ task, isSelected, onClick, onAccept, onReject, onDateChange, isSentByMe = false }: DispatchTaskCardProps) {
  const activeUserId = useAtomValue(activeUserIdAtom)
  const isAssignedToMe = task.assigneeId === activeUserId

  // Red dot only shows for Todo tickets with unread messages (NOT for sent tickets)
  const hasNotification = task.hasUnreadMessages && !isSentByMe

  // For sent tasks, only show X button (to cancel)
  // For assigned tasks, show accept/reject buttons (unless there's a notification)
  const showAcceptReject = isAssignedToMe && task.status !== 'completed' && task.status !== 'cancelled' && !hasNotification && !isSentByMe
  const showCancelOnly = isSentByMe && task.status !== 'completed' && task.status !== 'cancelled'

  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const completedDate = task.completedAt ? new Date(task.completedAt) : null

  const deadlineStr = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  // Calculate if task is late (completed after deadline)
  const daysLate = deadlineDate && completedDate && task.status === 'completed'
    ? Math.ceil((completedDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const isLate = daysLate > 0

  // For completed tasks, show completion date badge
  const getCompletionBadge = () => {
    if (task.status !== 'completed' || !deadlineDate) return null

    const displayDate = deadlineDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })

    if (isLate) {
      return {
        label: `${displayDate} - ${daysLate} day${daysLate === 1 ? '' : 's'} late`,
        variant: 'late' as const,
      }
    }

    return {
      label: displayDate,
      variant: 'ontime' as const,
    }
  }

  // Friendly relative deadline label for active tasks
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

  const completionBadge = getCompletionBadge()
  const deadlineLabel = task.status === 'completed' ? null : getDeadlineLabel()

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-3xl cursor-pointer transition-all flex items-center px-6 py-5 shadow-sm',
        isSelected
          ? 'bg-foreground/4 border border-foreground/6'
          : 'bg-white border border-foreground/6 hover:border-foreground/10 hover:shadow-md',
      )}
    >
      {/* Notification dot - shown only when there are unread messages */}
      {hasNotification && (
        <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-destructive" />
      )}

      {/* Left: text content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3 className="text-[17px] font-semibold text-foreground line-clamp-1 mb-1.5">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-[15px] text-foreground/50 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Date pill or completion badge */}
        {completionBadge ? (
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[13px] pl-2.5 pr-3 py-1.5 rounded-full font-medium",
            completionBadge.variant === 'late'
              ? "text-[#8B6914] bg-[#FCD34D]"
              : "text-white bg-success"
          )}>
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            {completionBadge.label}
          </span>
        ) : deadlineLabel ? (
          <button
            onClick={(e) => {
              if (isSentByMe && onDateChange) {
                e.stopPropagation()
                // TODO: Open date picker - for now just log
                console.log('Change date for task:', task.id)
              }
            }}
            disabled={!isSentByMe || !onDateChange}
            className={cn(
              "inline-flex items-center gap-1.5 text-[13px] text-foreground/90 bg-foreground/8 pl-2.5 pr-3 py-1.5 rounded-full font-medium",
              isSentByMe && onDateChange && "hover:bg-foreground/12 cursor-pointer transition-colors",
              !isSentByMe && "cursor-default"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            {deadlineLabel}
          </button>
        ) : null}
      </div>

      {/* Right: chevron or action buttons */}
      {(hasNotification || isSelected) ? (
        <div className="shrink-0 ml-4">
          <ChevronRight className="h-6 w-6 text-foreground/40" />
        </div>
      ) : showCancelOnly ? (
        <div className="shrink-0 ml-4">
          <button
            onClick={(e) => { e.stopPropagation(); onReject?.() }}
            className="h-14 w-14 rounded-full bg-foreground/6 flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-all"
            title="Cancel task"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>
      ) : showAcceptReject ? (
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button
            onClick={(e) => { e.stopPropagation(); onReject?.() }}
            className="h-14 w-14 rounded-full bg-foreground/6 flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-all"
            title="Reject"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAccept?.() }}
            className="h-14 w-14 rounded-full bg-success/20 flex items-center justify-center text-success hover:bg-success/30 transition-all"
            title={task.status === 'in_progress' ? 'Complete' : 'Accept'}
          >
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
