/**
 * ConductorIntentStrip - Chat-like right panel for Better Slack UI.
 * Messages as bubbles: left-aligned (received) / right-aligned (sent).
 * Input: white bg, rounded-2xl, send button = dark circle with ArrowUp.
 */

import { useState, useCallback, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { ArrowUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { activeUserAtom, conductorUsersAtom } from '@/atoms/conductor'
import { useConductor } from '@/context/ConductorContext'
import { useAppShellContext } from '@/context/AppShellContext'
import { getConductorSystemPrompt } from '@/lib/conductor-prompt'
import { navigate, routes } from '@/lib/navigate'
import type { TaskExecutionTier, TaskPriority } from '@craft-agent/core/types'

interface CoordinatorResponse {
  title: string
  description: string
  executionTier: TaskExecutionTier
  assigneeId?: string
  priority: TaskPriority
  estimatedMinutes?: number
  requiredSkills: string[]
  routingReason: string
  deadline?: number
}

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'assistant'
}

export function ConductorIntentStrip() {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeUser = useAtomValue(activeUserAtom)
  const users = useAtomValue(conductorUsersAtom)
  const { createTask, completeTask, findBestAssignee } = useConductor()
  const { activeWorkspaceId, onCreateSession, onSendMessage } = useAppShellContext()

  const addMessage = useCallback((text: string, sender: 'user' | 'assistant') => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, text, sender }])
  }, [])

  const buildReasoningMessage = useCallback((parsed: CoordinatorResponse, assignee: { name: string; role: string } | null): string => {
    if (parsed.executionTier === 'ai_direct') {
      return 'This doesn\'t require a human. Working on it...'
    }
    if (!assignee) {
      return `Routing task: ${parsed.routingReason}`
    }
    const matchedSkills = parsed.requiredSkills.filter(s =>
      users.find(u => u.id === parsed.assigneeId)?.skills.includes(s)
    )
    const skillMatch = parsed.requiredSkills.length > 0
      ? Math.round((matchedSkills.length / parsed.requiredSkills.length) * 100)
      : 0
    const user = users.find(u => u.id === parsed.assigneeId)
    const capacity = user
      ? Math.round((1 - user.currentTaskIds.length / user.maxConcurrentTasks) * 100)
      : 0
    return `Assigning to ${assignee.name} (${skillMatch}% skill match, ${capacity}% capacity).`
  }, [users])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing || !activeWorkspaceId) return

    setIsProcessing(true)
    const intent = input.trim()
    setInput('')
    addMessage(intent, 'user')

    try {
      const session = await onCreateSession(activeWorkspaceId, {
        hidden: true,
        systemPromptPreset: 'default',
        permissionMode: 'allow-all',
      })

      const coordinatorPrompt = getConductorSystemPrompt(users)
      const message = `${coordinatorPrompt}\n\n---\n\nUser intent from ${activeUser.name} (${activeUser.role}):\n"${intent}"`
      await onSendMessage(session.id, message)

      let attempts = 0
      const pollForResponse = async (): Promise<string | null> => {
        while (attempts < 60) {
          attempts++
          await new Promise(resolve => setTimeout(resolve, 500))
          const sessionData = await window.electronAPI.getSessionMessages(session.id)
          if (!sessionData) continue
          const assistantMsg = sessionData.messages.findLast(m => m.role === 'assistant')
          if (!assistantMsg?.content) continue
          if (!sessionData.isProcessing) return assistantMsg.content
        }
        return null
      }

      const response = await pollForResponse()
      if (!response) {
        addMessage('Timed out. Please try again.', 'assistant')
        setIsProcessing(false)
        return
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed: CoordinatorResponse = JSON.parse(jsonMatch[0])
          let assigneeId = parsed.assigneeId
          if (!assigneeId && parsed.executionTier === 'human') {
            const best = findBestAssignee(parsed.requiredSkills)
            assigneeId = best?.id
          }

          const assigneeUser = assigneeId ? users.find(u => u.id === assigneeId) : null
          const reasoning = buildReasoningMessage(parsed, assigneeUser ? { name: assigneeUser.name, role: assigneeUser.role } : null)
          addMessage(reasoning, 'assistant')

          const task = createTask({
            title: parsed.title,
            description: parsed.description,
            originalIntent: intent,
            requesterId: activeUser.id,
            assigneeId: parsed.executionTier === 'ai_direct' ? undefined : assigneeId,
            executionTier: parsed.executionTier,
            routingReason: parsed.routingReason,
            priority: parsed.priority,
            estimatedMinutes: parsed.estimatedMinutes,
            requiredSkills: parsed.requiredSkills,
            deadline: parsed.deadline,
          })

          if (parsed.executionTier === 'ai_direct') {
            setIsExecuting(true)
            setIsProcessing(false)

            const aiSession = await onCreateSession(activeWorkspaceId, {
              hidden: true,
              permissionMode: 'allow-all',
            })
            await onSendMessage(aiSession.id, intent)

            let aiAttempts = 0
            const pollForAiResult = async (): Promise<string | null> => {
              while (aiAttempts < 120) {
                aiAttempts++
                await new Promise(resolve => setTimeout(resolve, 500))
                const aiSessionData = await window.electronAPI.getSessionMessages(aiSession.id)
                if (!aiSessionData) continue
                if (!aiSessionData.isProcessing) {
                  const result = aiSessionData.messages.findLast(m => m.role === 'assistant')
                  return result?.content ?? null
                }
              }
              return null
            }

            const aiResult = await pollForAiResult()
            const resultText = aiResult ?? 'Task completed by AI'
            completeTask(task.id, resultText)
            addMessage(resultText, 'assistant')
            setIsExecuting(false)
          } else {
            setIsProcessing(false)
            addMessage(`Task created: ${parsed.title}`, 'assistant')
            setTimeout(() => {
              navigate(routes.view.conductor('myTasks', task.id))
            }, 2000)
          }
        } catch {
          addMessage('Could not parse response. Please try again.', 'assistant')
          setIsProcessing(false)
        }
      } else {
        addMessage(response, 'assistant')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Intent submission failed:', error)
      addMessage('Something went wrong. Please try again.', 'assistant')
      setIsProcessing(false)
    }
  }, [input, isProcessing, activeWorkspaceId, activeUser, users, onCreateSession, onSendMessage, createTask, completeTask, findBestAssignee, buildReasoningMessage, addMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !isProcessing && !isExecuting && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-foreground/25">
              What do you want to get done today?
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-lg mx-auto">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                msg.sender === 'user'
                  ? 'self-end bg-foreground/[0.08] text-foreground'
                  : 'self-start bg-foreground/[0.03] text-foreground/80',
              )}
            >
              {msg.text}
            </div>
          ))}

          {(isProcessing || isExecuting) && (
            <div className="self-start bg-foreground/[0.03] rounded-2xl px-4 py-2.5 text-sm text-foreground/50 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isExecuting ? 'AI is working on it...' : 'Thinking...'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom-pinned input */}
      <div className="shrink-0 px-5 py-4">
        <div className="relative max-w-lg mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to get done today?"
            className={cn(
              'w-full rounded-2xl bg-white px-4 py-3 pr-12',
              'text-sm text-foreground placeholder:text-foreground/25',
              'resize-none focus:outline-none shadow-minimal',
            )}
            disabled={isProcessing}
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              input.trim() && !isProcessing
                ? 'bg-foreground text-background'
                : 'bg-foreground/10 text-foreground/25'
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
