/**
 * TaskDetailPage - Full task view with details, actions, and AI chat.
 */

import { useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import { conductorTasksAtom, conductorUsersAtom, activeUserIdAtom } from '@/atoms/conductor'
import { useConductor } from '@/context/ConductorContext'
import { FeedbackButtons } from './FeedbackButtons'
import { AnonymousBadge } from './AnonymousBadge'
import { DeadlineIndicator } from './DeadlineIndicator'
import { USER_COLORS, getUserInitials } from '@/config/conductor-users'
import { Bot, Cpu, User, Play, CheckCircle2, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TaskPriority, TaskExecutionTier, ConductorTaskStatus } from '@craft-agent/core/types'

const PRIORITY_STYLES: Record<TaskPriority, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-destructive/20 text-destructive' },
  high: { label: 'High', className: 'bg-orange-500/20 text-orange-600' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-600' },
  low: { label: 'Low', className: 'bg-foreground/5 text-muted-foreground' },
}

const STATUS_LABELS: Record<ConductorTaskStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  reassigned: 'Reassigned',
  cancelled: 'Cancelled',
}

const TIER_LABELS: Record<TaskExecutionTier, { label: string; icon: typeof Bot }> = {
  ai_direct: { label: 'AI Direct', icon: Bot },
  ai_agent: { label: 'AI Agent', icon: Cpu },
  human: { label: 'Human', icon: User },
}

interface TaskDetailPageProps {
  taskId: string
}

export function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const tasks = useAtomValue(conductorTasksAtom)
  const users = useAtomValue(conductorUsersAtom)
  const activeUserId = useAtomValue(activeUserIdAtom)
  const { startTask, completeTask, submitFeedback, findBestAssignee, reassignTask } = useConductor()

  const task = tasks.get(taskId)
  if (!task) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Task not found</p>
      </div>
    )
  }

  const requester = users.find(u => u.id === task.requesterId)
  const assignee = users.find(u => u.id === task.assigneeId)
  const priority = PRIORITY_STYLES[task.priority]
  const tierInfo = TIER_LABELS[task.executionTier]
  const TierIcon = tierInfo.icon
  const isAssignedToMe = task.assigneeId === activeUserId
  const isMySubmission = task.requesterId === activeUserId

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-foreground/5 px-6 py-4">
        <div className="flex items-start gap-3">
          <TierIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground">{task.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', priority.className)}>
                {priority.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {STATUS_LABELS[task.status]}
              </span>
              <span className="text-xs text-muted-foreground">
                · {tierInfo.label}
              </span>
              {task.deadline && (
                <DeadlineIndicator deadline={task.deadline} startedAt={task.startedAt} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Description */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{task.description}</p>
        </section>

        {/* Original intent */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Original Request</h3>
          <p className="text-sm text-foreground/70 italic">"{task.originalIntent}"</p>
        </section>

        {/* Routing reason */}
        {task.routingReason && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Routing Reason</h3>
            <p className="text-sm text-foreground/80">{task.routingReason}</p>
          </section>
        )}

        {/* Requester */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Requested By</h3>
          <AnonymousBadge
            isAnonymous={task.isAnonymous}
            requesterRevealed={task.requesterRevealed}
            requesterName={requester?.name}
          />
        </section>

        {/* Assignee */}
        {assignee && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Assigned To</h3>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                style={{ backgroundColor: USER_COLORS[assignee.id] ?? '#6b7280' }}
              >
                {getUserInitials(assignee.name)}
              </div>
              <span className="text-sm font-medium">{assignee.name}</span>
              <span className="text-xs text-muted-foreground">· {assignee.role}</span>
            </div>
          </section>
        )}

        {/* Required skills */}
        {task.requiredSkills.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {task.requiredSkills.map(skill => (
                <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Result */}
        {task.result && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Result</h3>
            <div className="rounded-lg border border-foreground/5 bg-foreground/[0.02] p-3">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{task.result}</p>
            </div>
          </section>
        )}

        {/* Feedback */}
        {task.status === 'completed' && isMySubmission && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Feedback</h3>
            <FeedbackButtons
              feedback={task.feedback}
              showKudos={task.executionTier === 'human'}
              onSubmit={(feedback) => submitFeedback(task.id, feedback)}
            />
          </section>
        )}
      </div>

      {/* Action bar */}
      {isAssignedToMe && task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="shrink-0 border-t border-foreground/5 px-6 py-3 flex items-center gap-2">
          {(task.status === 'assigned' || task.status === 'reassigned') && (
            <Button
              onClick={() => startTask(task.id)}
              className="gap-2"
              size="sm"
            >
              <Play className="h-3.5 w-3.5" />
              Start Working
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              onClick={() => completeTask(task.id, 'Marked as complete')}
              className="gap-2"
              size="sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Complete
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => {
              const next = findBestAssignee(task.requiredSkills, [activeUserId])
              if (next) reassignTask(task.id, next.id, 'Manual reassignment')
            }}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Reassign
          </Button>
        </div>
      )}
    </div>
  )
}
