/**
 * TaskListPanel - Scrollable task cards grouped by status.
 * Replaces SessionList in the navigator slot when in conductor mode.
 */

import { useAtomValue } from 'jotai'
import type { ConductorTask, ConductorTaskStatus } from '@craft-agent/core/types'
import { myTasksAtom, submittedTasksAtom, allTasksAtom } from '@/atoms/conductor'
import type { ConductorFilter } from '../../../shared/types'
import { TaskCard } from './TaskCard'
import { ScrollArea } from '@/components/ui/scroll-area'

const STATUS_ORDER: ConductorTaskStatus[] = ['in_progress', 'assigned', 'pending', 'reassigned', 'completed']

const STATUS_LABELS: Record<ConductorTaskStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  reassigned: 'Reassigned',
  cancelled: 'Cancelled',
}

interface TaskListPanelProps {
  filter: ConductorFilter
  selectedTaskId?: string | null
  onTaskSelect: (taskId: string) => void
}

export function TaskListPanel({ filter, selectedTaskId, onTaskSelect }: TaskListPanelProps) {
  const myTasks = useAtomValue(myTasksAtom)
  const submitted = useAtomValue(submittedTasksAtom)
  const allTasks = useAtomValue(allTasksAtom)

  // Select the right task list based on filter
  let tasks: ConductorTask[]
  switch (filter.kind) {
    case 'myTasks':
      tasks = myTasks
      break
    case 'submitted':
      tasks = submitted
      break
    case 'allTasks':
      tasks = allTasks
      break
    default:
      tasks = []
  }

  // Group tasks by status
  const grouped = new Map<ConductorTaskStatus, ConductorTask[]>()
  for (const task of tasks) {
    const existing = grouped.get(task.status) ?? []
    existing.push(task)
    grouped.set(task.status, existing)
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm px-4">
        {filter.kind === 'myTasks' && 'No tasks assigned to you'}
        {filter.kind === 'submitted' && 'No tasks submitted yet'}
        {filter.kind === 'allTasks' && 'No tasks yet'}
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="py-1">
        {STATUS_ORDER.map((status) => {
          const statusTasks = grouped.get(status)
          if (!statusTasks?.length) return null

          return (
            <div key={status}>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {STATUS_LABELS[status]} ({statusTasks.length})
              </div>
              {statusTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={task.id === selectedTaskId}
                  onClick={() => onTaskSelect(task.id)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
