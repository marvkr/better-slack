/**
 * WinsFeed - Timeline of completed tasks with reactions.
 * Shows in the navigator panel when "Shared Wins" is selected.
 */

import { useAtomValue } from 'jotai'
import { sharedWinsAtom, dispatchTasksAtom } from '@/atoms/dispatch'
import { useDispatch } from '@/context/DispatchContext'
import { FeedbackButtons } from './FeedbackButtons'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Cpu, User, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskExecutionTier } from '@craft-agent/core/types'

const TIER_ICONS: Record<TaskExecutionTier, typeof Bot> = {
  ai_direct: Bot,
  ai_agent: Cpu,
  human: User,
}

const TIER_LABELS: Record<TaskExecutionTier, string> = {
  ai_direct: 'AI',
  ai_agent: 'AI Agent',
  human: 'Team Member',
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function WinsFeed() {
  const wins = useAtomValue(sharedWinsAtom)
  const tasks = useAtomValue(dispatchTasksAtom)
  const { submitFeedback } = useDispatch()

  if (wins.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground px-4 gap-2">
        <Trophy className="h-8 w-8 opacity-30" />
        <p className="text-sm">No completed tasks yet</p>
        <p className="text-xs text-muted-foreground/70">Completed tasks will appear here</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="py-2 space-y-1">
        {wins.map((win) => {
          const TierIcon = TIER_ICONS[win.executionTier]
          const task = tasks.get(win.taskId)

          return (
            <div
              key={win.id}
              className="px-3 py-2.5 hover:bg-foreground/[0.03] transition-colors"
            >
              {/* Completed by */}
              <div className="flex items-center gap-2 mb-1">
                <TierIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  {win.completedByName}
                </span>
                <span className="text-xs text-muted-foreground">
                  · {win.completedByRole}
                </span>
                <span className="text-xs text-muted-foreground/60 ml-auto">
                  {timeAgo(win.completedAt)}
                </span>
              </div>

              {/* Task title */}
              <p className="text-sm text-foreground/90 pl-5.5">
                {win.taskTitle}
              </p>

              {/* Feedback buttons */}
              <div className="pl-5.5 mt-1.5">
                <FeedbackButtons
                  feedback={task?.feedback}
                  showKudos={win.executionTier === 'human'}
                  onSubmit={(feedback) => submitFeedback(win.taskId, feedback)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
