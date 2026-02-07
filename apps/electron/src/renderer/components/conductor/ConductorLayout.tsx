/**
 * ConductorLayout - 2-column layout for the conductor navigator.
 * Left column: tab bar (todo/sent/done) + scrollable task cards
 * Right column: TaskDetailPage when a task is selected, or ConductorIntentStrip when none
 */

import { useState, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import { myTasksAtom, submittedTasksAtom, completedTasksAtom } from '@/atoms/conductor'
import { useConductor } from '@/context/ConductorContext'
import { useNavigationState, isConductorNavigation } from '@/contexts/NavigationContext'
import { navigate, routes } from '@/lib/navigate'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConductorTaskCard } from './ConductorTaskCard'
import { ConductorIntentStrip } from './ConductorIntentStrip'
import { TaskDetailPage } from './TaskDetailPage'
import type { ConductorTask } from '@craft-agent/core/types'

type Tab = 'todo' | 'sent' | 'done'

const TABS: { id: Tab; label: string }[] = [
  { id: 'todo', label: 'todo' },
  { id: 'sent', label: 'sent' },
  { id: 'done', label: 'done' },
]

const EMPTY_MESSAGES: Record<Tab, string> = {
  todo: 'No tasks assigned to you',
  sent: 'No tasks submitted yet',
  done: 'No completed tasks yet',
}

export function ConductorLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('todo')
  const navState = useNavigationState()
  const { startTask, completeTask, cancelTask } = useConductor()

  const myTasks = useAtomValue(myTasksAtom)
  const submittedTasks = useAtomValue(submittedTasksAtom)
  const completedTasks = useAtomValue(completedTasksAtom)

  // "todo" shows my tasks excluding completed ones
  const todoTasks = useMemo(
    () => myTasks.filter(t => t.status !== 'completed'),
    [myTasks],
  )

  const tasks: ConductorTask[] = activeTab === 'todo'
    ? todoTasks
    : activeTab === 'sent'
      ? submittedTasks
      : completedTasks

  // Selected task from navigation state
  const selectedTaskId = isConductorNavigation(navState) && navState.details?.type === 'task'
    ? navState.details.taskId
    : null

  const handleTaskClick = (taskId: string) => {
    navigate(routes.view.conductor('myTasks', taskId))
  }

  const handleAccept = (task: ConductorTask) => {
    if (task.status === 'in_progress') {
      completeTask(task.id, 'Marked as complete')
    } else {
      startTask(task.id)
    }
  }

  const handleReject = (task: ConductorTask) => {
    cancelTask(task.id)
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left column: tabs + task list */}
      <div className="flex flex-col h-full w-[55%] min-w-0 shrink-0">
        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-1 px-4 pt-4 pb-2">
          {TABS.map(tab => {
            const count = tab.id === 'todo' ? todoTasks.length
              : tab.id === 'sent' ? submittedTasks.length
              : completedTasks.length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-foreground/[0.07] text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-1.5 text-[10px] tabular-nums',
                    activeTab === tab.id ? 'text-foreground/60' : 'text-muted-foreground/60',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm px-4">
            {EMPTY_MESSAGES[activeTab]}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 px-4 py-2 pb-4">
              {tasks.map(task => (
                <ConductorTaskCard
                  key={task.id}
                  task={task}
                  isSelected={task.id === selectedTaskId}
                  onClick={() => handleTaskClick(task.id)}
                  onAccept={() => handleAccept(task)}
                  onReject={() => handleReject(task)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Vertical divider */}
      <div className="w-px bg-foreground/5 shrink-0" />

      {/* Right column: task detail or intent strip */}
      <div className="flex-1 min-w-0 h-full">
        {selectedTaskId ? (
          <TaskDetailPage taskId={selectedTaskId} />
        ) : (
          <ConductorIntentStrip />
        )}
      </div>
    </div>
  )
}
