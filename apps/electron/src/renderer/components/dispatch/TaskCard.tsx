/**
 * TaskCard - Individual task card for the task list.
 * Shows title, priority badge, deadline indicator, anonymous badge.
 */

import { cn } from '@/lib/utils'
import { useAtomValue } from 'jotai'
import type { DispatchTask, TaskPriority } from '@craft-agent/core/types'
import { dispatchUsersAtom } from '@/atoms/dispatch'
import { DeadlineIndicator } from './DeadlineIndicator'
import { AnonymousBadge } from './AnonymousBadge'
import { Bot, User, Cpu } from 'lucide-react'

const PRIORITY_STYLES: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: 'URGENT', className: 'bg-destructive/20 text-destructive' },
  high: { label: 'HIGH', className: 'bg-orange-500/20 text-orange-600' },
  medium: { label: 'MED', className: 'bg-yellow-500/20 text-yellow-600' },
  low: { label: 'LOW', className: 'bg-foreground/5 text-muted-foreground' },
}

const TIER_ICONS = {
  ai_direct: Bot,
  ai_agent: Cpu,
  human: User,
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-l-muted-foreground/30',
  assigned: 'border-l-blue-500',
  in_progress: 'border-l-yellow-500',
  completed: 'border-l-green-500',
  reassigned: 'border-l-orange-500',
  cancelled: 'border-l-destructive opacity-50',
}

interface TaskCardProps {
  task: DispatchTask
  isSelected: boolean
  onClick: () => void
}

export function TaskCard({ task, isSelected, onClick }: TaskCardProps) {
  const users = useAtomValue(dispatchUsersAtom)
  const priority = PRIORITY_STYLES[task.priority]
  const TierIcon = TIER_ICONS[task.executionTier]
  const requester = users.find(u => u.id === task.requesterId)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 border-l-2 transition-colors',
        'hover:bg-foreground/[0.03]',
        STATUS_STYLES[task.status] ?? 'border-l-transparent',
        isSelected && 'bg-foreground/[0.05]',
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <TierIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <span className="text-sm font-medium text-foreground line-clamp-2 flex-1">
          {task.title}
        </span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0', priority.className)}>
          {priority.label}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-1.5 pl-5.5">
        <AnonymousBadge
          isAnonymous={task.isAnonymous}
          requesterRevealed={task.requesterRevealed}
          requesterName={requester?.name}
        />
        {task.deadline && (
          <DeadlineIndicator
            deadline={task.deadline}
            startedAt={task.startedAt}
          />
        )}
        {task.status === 'completed' && (
          <span className="text-[10px] text-green-500 font-medium">Done</span>
        )}
      </div>
    </button>
  )
}
