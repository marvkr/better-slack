/**
 * TaskDetailPage - Chat-bubble style task detail view for Better Slack UI.
 * Simple header with task title, chat bubbles for content, input at bottom.
 */

import { useState, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import { dispatchTasksAtom, dispatchUsersAtom, activeUserIdAtom } from '@/atoms/dispatch'
import { useDispatch } from '@/context/DispatchContext'
import { ArrowUp, X, Check } from 'lucide-react'
import * as api from '@/lib/api-client'
import { getWebSocket } from '@/lib/websocket-client'
import { navigate, routes } from '@/lib/navigate'

interface TaskDetailPageProps {
  taskId: string
}

interface TaskMessage {
  id: string
  userId: string | null
  content: string
  role: 'user' | 'assistant'
  taskId: string
  createdAt: string
}

export function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const tasks = useAtomValue(dispatchTasksAtom)
  const users = useAtomValue(dispatchUsersAtom)
  const activeUserId = useAtomValue(activeUserIdAtom)
  const { startTask, completeTask, cancelTask } = useDispatch()
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState<TaskMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const task = tasks.get(taskId)

  // Fetch messages on mount and when taskId changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true)
        const taskDetails = await api.getTaskDetails(taskId, activeUserId)
        if (taskDetails.messages) {
          setMessages(taskDetails.messages)
        }
      } catch (error) {
        console.error('[TaskDetailPage] Failed to fetch messages:', error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [taskId, activeUserId])

  // Subscribe to WebSocket for real-time message updates
  useEffect(() => {
    const ws = getWebSocket()

    const unsubscribe = ws.onMessage((message) => {
      if (message.type === 'message:new' && message.data.taskId === taskId) {
        // Add new message to state if it's for this task
        setMessages(prev => {
          // Avoid duplicates - check if message already exists
          const exists = prev.some(m => m.id === message.data.message.id)
          if (exists) return prev
          return [...prev, message.data.message]
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [taskId])

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

  const handleReply = async () => {
    if (!reply.trim() || isSending) return

    try {
      setIsSending(true)

      // Send message to backend
      const newMessage = await api.sendTaskMessage(task.id, reply.trim(), activeUserId)

      // Add message to local state
      setMessages(prev => [...prev, newMessage])

      setReply('')
    } catch (error) {
      console.error('[TaskDetailPage] Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }

  const handleClose = () => {
    // Navigate back to main chat (dispatch view without task selected)
    navigate(routes.view.dispatch('myTasks'))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Close button */}
      <div className="shrink-0 flex justify-end px-6 pt-4">
        <button
          onClick={handleClose}
          className="h-8 w-8 rounded-full bg-foreground/6 flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chat-style body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-3">
          {/* Task description as initial system message */}
          {task.description && (
            <div className="self-start max-w-[75%] rounded-2xl bg-[#EBEBE8] px-4 py-3 text-[15px] text-foreground">
              {task.description}
            </div>
          )}

          {/* Original intent as sent bubble */}
          <div className="self-end max-w-[75%] rounded-2xl bg-white px-4 py-3 text-[15px] text-foreground shadow-sm">
            {task.originalIntent}
            {requester && !task.isAnonymous && (
              <span className="block text-xs text-foreground/40 mt-1">
                — {requester.name}
              </span>
            )}
          </div>

          {/* Routing reason */}
          {task.routingReason && (
            <div className="self-start max-w-[75%] rounded-2xl bg-[#EBEBE8] px-4 py-3 text-[15px] text-foreground/70">
              {task.routingReason}
            </div>
          )}

          {/* Loading state */}
          {isLoadingMessages && (
            <div className="self-center text-sm text-foreground/30 py-4">
              Loading messages...
            </div>
          )}

          {/* Message thread */}
          {!isLoadingMessages && messages.map((message) => {
            const sender = message.userId ? users.find(u => u.id === message.userId) : null
            const isMyMessage = message.userId === activeUserId
            const isSystemMessage = message.role === 'assistant' && !message.userId

            return (
              <div
                key={message.id}
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3 text-[15px]',
                  isMyMessage
                    ? 'self-end bg-white text-foreground shadow-sm'
                    : isSystemMessage
                    ? 'self-start bg-[#EBEBE8] text-foreground/70'
                    : 'self-start bg-[#EBEBE8] text-foreground'
                )}
              >
                {message.content}
                {sender && (
                  <span className="block text-xs text-foreground/40 mt-1">
                    — {sender.name}
                  </span>
                )}
              </div>
            )
          })}

        </div>
      </div>

      {/* Input at bottom */}
      {canAct && (
        <div className="shrink-0 px-6 pb-6 space-y-3">
          {/* Action badges */}
          <div className="flex gap-2">
            <button
              onClick={() => cancelTask(task.id)}
              className="h-8 w-8 rounded-full bg-foreground/6 flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-colors"
              title="Decline Task"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => completeTask(task.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/15 text-success text-sm font-medium shadow-sm hover:shadow hover:bg-success/25 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Complete Task</span>
            </button>
          </div>

          {/* Message input */}
          <div className="relative">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me everything about the task."
              disabled={isSending}
              className={cn(
                'w-full rounded-3xl bg-white px-5 py-4 pr-14',
                'text-[15px] text-foreground placeholder:text-foreground/30',
                'resize-none focus:outline-none shadow-sm',
                'min-h-[60px]',
                isSending && 'opacity-50 cursor-not-allowed'
              )}
              rows={1}
            />
            <button
              onClick={handleReply}
              disabled={!reply.trim() || isSending}
              className={cn(
                'absolute right-3 bottom-3 h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                reply.trim() && !isSending
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/10 text-foreground/25'
              )}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
