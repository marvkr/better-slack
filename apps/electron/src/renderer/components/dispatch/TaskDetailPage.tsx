/**
 * TaskDetailPage - Chat-bubble style task detail view for Better Slack UI.
 * Simple header with task title, chat bubbles for content, input at bottom.
 */

import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import { dispatchTasksAtom, dispatchUsersAtom, activeUserIdAtom } from '@/atoms/dispatch'
import { useDispatch } from '@/context/DispatchContext'
import { ArrowUp } from 'lucide-react'

interface TaskDetailPageProps {
  taskId: string
}

export function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const tasks = useAtomValue(dispatchTasksAtom)
  const users = useAtomValue(dispatchUsersAtom)
  const activeUserId = useAtomValue(activeUserIdAtom)
  const { startTask, completeTask } = useDispatch()
  const [reply, setReply] = useState('')

  const task = tasks.get(taskId)
  if (!task) {
    return (
      <div className="flex items-center justify-center h-full text-foreground/30">
        <p className="text-sm">Task not found</p>
      </div>
    )
  }

  const requester = users.find(u => u.id === task.requesterId)
  const isAssignedToMe = task.assigneeId === activeUserId
  const canAct = isAssignedToMe && task.status !== 'completed' && task.status !== 'cancelled'

  const handleReply = () => {
    if (!reply.trim()) return
    if (canAct) {
      completeTask(task.id, reply.trim())
    }
    setReply('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Simple header - just the task title */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-foreground/[0.06]">
        <h2 className="text-lg font-bold text-foreground">{task.title}</h2>
      </div>

      {/* Chat-style body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-3 max-w-lg">
          {/* Description as received bubble */}
          {task.description && (
            <div className="self-start max-w-[85%] rounded-2xl bg-foreground/[0.03] px-4 py-2.5 text-sm text-foreground/80">
              {task.description}
            </div>
          )}

          {/* Original intent as sent bubble */}
          <div className="self-end max-w-[85%] rounded-2xl bg-foreground/[0.08] px-4 py-2.5 text-sm text-foreground">
            "{task.originalIntent}"
            {requester && !task.isAnonymous && (
              <span className="block text-xs text-foreground/40 mt-1">
                — {requester.name}
              </span>
            )}
          </div>

          {/* Routing reason */}
          {task.routingReason && (
            <div className="self-start max-w-[85%] rounded-2xl bg-foreground/[0.03] px-4 py-2.5 text-sm text-foreground/60 italic">
              {task.routingReason}
            </div>
          )}

          {/* Result as received bubble */}
          {task.result && (
            <div className="self-start max-w-[85%] rounded-2xl bg-foreground/[0.03] px-4 py-3 text-sm text-foreground/80">
              {task.result}
            </div>
          )}

          {/* Action prompts */}
          {canAct && (task.status === 'assigned' || task.status === 'reassigned') && (
            <button
              onClick={() => startTask(task.id)}
              className="self-start text-sm text-accent font-medium hover:underline"
            >
              Start working on this
            </button>
          )}
        </div>
      </div>

      {/* Input at bottom */}
      {canAct && (
        <div className="shrink-0 px-5 py-4">
          <div className="relative max-w-lg">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={task.status === 'in_progress' ? 'Reply to complete...' : 'Add a note...'}
              className={cn(
                'w-full rounded-2xl bg-white px-4 py-3 pr-12',
                'text-sm text-foreground placeholder:text-foreground/25',
                'resize-none focus:outline-none shadow-minimal',
              )}
              rows={1}
            />
            <button
              onClick={handleReply}
              disabled={!reply.trim()}
              className={cn(
                'absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                reply.trim()
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/10 text-foreground/25'
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
