/**
 * ConductorTaskCard - Redesigned card with accept/reject action buttons.
 * Used in the 2-column ConductorLayout.
 */

import { cn } from '@/lib/utils'
import { useAtomValue } from 'jotai'
import type { ConductorTask, TaskPriority } from '@craft-agent/core/types'
import { conductorUsersAtom, activeUserIdAtom } from '@/atoms/conductor'
import { CheckCircle2, XCircle, Calendar, Bot, User, Cpu } from 'lucide-react'

const PRIORITY_STYLES: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: 'URGENT', className: 'bg-destructive/15 text-destructive' },
  high: { label: 'HIGH', className: 'bg-orange-500/15 text-orange-600' },
  medium: { label: 'MED', className: 'bg-yellow-500/15 text-yellow-600' },
  low: { label: 'LOW', className: 'bg-foreground/5 text-muted-foreground' },
}

const TIER_ICONS = {
  ai_direct: Bot,
  ai_agent: Cpu,
  human: User,
}

interface ConductorTaskCardProps {
  task: ConductorTask
  isSelected: boolean
  onClick: () => void
  onAccept?: () => void
  onReject?: () => void
}

export function ConductorTaskCard({ task, isSelected, onClick, onAccept, onReject }: ConductorTaskCardProps) {
  const users = useAtomValue(conductorUsersAtom)
  const activeUserId = useAtomValue(activeUserIdAtom)
  const priority = PRIORITY_STYLES[task.priority]
  const TierIcon = TIER_ICONS[task.executionTier]
  const requester = users.find(u => u.id === task.requesterId)
  const isAssignedToMe = task.assigneeId === activeUserId
  const showActions = isAssignedToMe && task.status !== 'completed' && task.status !== 'cancelled'

  const deadlineDate = task.deadline ? new Date(task.deadline) : null
  const deadlineStr = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-background border border-foreground/[0.06] rounded-xl px-4 py-3.5 cursor-pointer transition-all',
        'hover:border-foreground/10 hover:shadow-sm',
        isSelected && 'border-accent/30 shadow-sm ring-1 ring-accent/10',
      )}
    >
      {/* Top: priority badge + tier icon */}
      <div className="flex items-center gap-2 mb-2">
        <TierIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', priority.className)}>
          {priority.label}
        </span>
        {task.status === 'completed' && (
          <span className="text-[10px] font-medium text-success px-1.5 py-0.5 rounded-full bg-success/10">
            Done
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5">
          {task.description}
        </p>
      )}

      {/* Bottom row: deadline + requester + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {deadlineStr && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-foreground/[0.03] px-1.5 py-0.5 rounded-md">
              <Calendar className="h-2.5 w-2.5" />
              {deadlineStr}
            </span>
          )}
          {requester && !task.isAnonymous && (
            <span className="text-[10px] text-muted-foreground truncate">
              from {requester.name.split(' ')[0]}
            </span>
          )}
          {task.isAnonymous && !task.requesterRevealed && (
            <span className="text-[10px] text-muted-foreground italic">Anonymous</span>
          )}
        </div>

        {/* Accept / Reject buttons */}
        {showActions && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onAccept?.() }}
              className="p-1 rounded-full text-success/70 hover:text-success hover:bg-success/10 transition-colors"
              title={task.status === 'in_progress' ? 'Complete' : 'Accept'}
            >
              <CheckCircle2 className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReject?.() }}
              className="p-1 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Reject"
            >
              <XCircle className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
