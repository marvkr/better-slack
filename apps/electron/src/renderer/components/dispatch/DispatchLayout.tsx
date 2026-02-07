/**
 * DispatchLayout - 2-column layout for the dispatch navigator.
 * Left column: tab bar (todo/sent/done) + scrollable task cards
 * Right column: TaskDetailPage when a task is selected, or DispatchIntentStrip when none
 */

import { useState, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import { myTasksAtom, submittedTasksAtom, completedTasksAtom } from '@/atoms/dispatch'
import { useDispatch } from '@/context/DispatchContext'
import { useNavigationState, isDispatchNavigation } from '@/contexts/NavigationContext'
import { navigate, routes } from '@/lib/navigate'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DispatchTaskCard } from './DispatchTaskCard'
import { DispatchIntentStrip } from './DispatchIntentStrip'
import { TaskDetailPage } from './TaskDetailPage'
import type { DispatchTask } from '@craft-agent/core/types'

type Tab = 'todo' | 'sent' | 'done'

const TABS: { id: Tab; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'sent', label: 'Sent' },
  { id: 'done', label: 'Done' },
]

const EMPTY_MESSAGES: Record<Tab, string> = {
  todo: 'No tasks assigned to you',
  sent: 'No tasks submitted yet',
  done: 'No completed tasks yet',
}

export function DispatchLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('todo')
  const navState = useNavigationState()
  const { startTask, completeTask, cancelTask } = useDispatch()

  const myTasks = useAtomValue(myTasksAtom)
  const submittedTasks = useAtomValue(submittedTasksAtom)
  const completedTasks = useAtomValue(completedTasksAtom)

  // "todo" shows my tasks excluding completed ones
  const todoTasks = useMemo(
    () => myTasks.filter(t => t.status !== 'completed'),
    [myTasks],
  )

  const tasks: DispatchTask[] = activeTab === 'todo'
    ? todoTasks
    : activeTab === 'sent'
      ? submittedTasks
      : completedTasks

  // Selected task from navigation state
  const selectedTaskId = isDispatchNavigation(navState) && navState.details?.type === 'task'
    ? navState.details.taskId
    : null

  const handleTaskClick = (taskId: string) => {
    navigate(routes.view.dispatch('myTasks', taskId))
  }

  const handleAccept = (task: DispatchTask) => {
    if (task.status === 'in_progress') {
      completeTask(task.id, 'Marked as complete')
    } else {
      startTask(task.id)
    }
  }

  const handleReject = (task: DispatchTask) => {
    cancelTask(task.id)
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left column: tabs + task list */}
      <div className="flex flex-col h-full w-[45%] min-w-0 shrink-0">
        {/* Tab bar - lowercase serif, bold active vs light inactive */}
        <div className="shrink-0 flex items-baseline gap-6 px-6 pt-5 pb-3 h-16">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: activeTab === tab.id ? 28 : 20,
                letterSpacing: '-0.02em',
                color: activeTab === tab.id ? '#1E1E1E' : '#B3B3B3',
              }}
              className="font-normal pb-1 transition-[font-size,color] duration-200 ease-out"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-foreground/30 text-sm px-6">
            {EMPTY_MESSAGES[activeTab]}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 px-5 py-4 pb-6">
              {tasks.map(task => (
                <DispatchTaskCard
                  key={task.id}
                  task={task}
                  isSelected={task.id === selectedTaskId}
                  onClick={() => handleTaskClick(task.id)}
                  onAccept={() => handleAccept(task)}
                  onReject={() => handleReject(task)}
                  isSentByMe={activeTab === 'sent'}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Vertical divider - padded top and bottom */}
      <div className="shrink-0 py-6">
        <div className="w-px h-full bg-foreground/[0.08]" />
      </div>

      {/* Right column: task detail or intent strip */}
      <div className="flex-1 min-w-0 h-full">
        {selectedTaskId ? (
          <TaskDetailPage taskId={selectedTaskId} />
        ) : (
          <DispatchIntentStrip />
        )}
      </div>
    </div>
  )
}
