/**
 * DispatchLayout - 2-column layout for the dispatch navigator.
 * Left column: tab bar (todo/sent/done) + scrollable task cards
 * Right column: TaskDetailPage when a task is selected, or DispatchIntentStrip when none
 */

import { useState, useMemo, useEffect } from 'react'
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

  const handleEmptySpaceClick = () => {
    // Navigate to main chat when clicking empty space
    navigate(routes.view.dispatch('myTasks'))
  }

  // Keyboard navigation: Tab/Shift+Tab to cycle through tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Tab key
      if (e.key !== 'Tab') return

      // Don't interfere if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      e.preventDefault()

      const currentIndex = TABS.findIndex(tab => tab.id === activeTab)
      let nextIndex: number

      if (e.shiftKey) {
        // Shift+Tab: go to previous tab
        nextIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1
      } else {
        // Tab: go to next tab
        nextIndex = currentIndex === TABS.length - 1 ? 0 : currentIndex + 1
      }

      setActiveTab(TABS[nextIndex].id)
      navigate(routes.view.dispatch('myTasks'))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left column: tabs + task list */}
      <div className="flex flex-col h-full w-[45%] min-w-0 shrink-0">
        {/* Tab bar - lowercase serif, bold active vs light inactive */}
        <div className="shrink-0 flex items-center gap-6 px-6 h-20 min-h-[80px]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                // Clear selected task when switching tabs
                navigate(routes.view.dispatch('myTasks'))
              }}
              style={{
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontSize: activeTab === tab.id ? 28 : 20,
                letterSpacing: '-0.02em',
                color: activeTab === tab.id ? '#1E1E1E' : '#B3B3B3',
              }}
              className="font-normal transition-[font-size,color] duration-200 ease-out leading-none"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div
            onClick={handleEmptySpaceClick}
            className="flex-1 flex items-center justify-center text-foreground/30 text-sm px-6 cursor-pointer hover:bg-foreground/[0.02] transition-colors"
          >
            {EMPTY_MESSAGES[activeTab]}
          </div>
        ) : (
          <ScrollArea className="flex-1" onClick={(e) => {
            // If clicking on the ScrollArea background (not a task card), go to main chat
            if (e.target === e.currentTarget) {
              handleEmptySpaceClick()
            }
          }}>
            <div className="flex flex-col gap-3 px-5 py-4 pb-6 min-h-full">
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
