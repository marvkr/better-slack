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
import { Bot, User, Cpu, Check } from 'lucide-react'

function formatCompletionDate(timestamp: number): string {
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

function calculateLateDays(completedAt: number, deadline: number): number {
  const diffMs = completedAt - deadline
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

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
        'w-full text-left px-3 py-2.5 border-l-2 transition-colors bg-white',
        'hover:bg-gray-50',
        STATUS_STYLES[task.status] ?? 'border-l-transparent',
        isSelected && 'bg-gray-100',
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
        {task.status === 'completed' && task.completedAt ? (
          (() => {
            const completionDate = formatCompletionDate(task.completedAt)
            const isLate = task.deadline && task.completedAt > task.deadline
            const lateDays = isLate ? calculateLateDays(task.completedAt, task.deadline!) : 0

            return (
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium',
                  isLate
                    ? 'bg-[#D4A574] text-white'
                    : 'bg-[#5B9A6C] text-white'
                )}
              >
                <Check className="h-3 w-3" />
                <span>
                  {completionDate}
                  {isLate && ` - ${lateDays} day${lateDays > 1 ? 's' : ''} late`}
                </span>
              </div>
            )
          })()
        ) : task.deadline ? (
          <DeadlineIndicator
            deadline={task.deadline}
            startedAt={task.startedAt}
          />
        ) : null}
      </div>
    </button>
  )
}
