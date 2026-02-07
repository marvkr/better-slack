/**
 * ConductorIntentStrip - Bottom-pinned input bar for the right column.
 * Simplified version of IntentInput that pins to the bottom with a chat-like feel.
 * Reuses the same AI coordinator logic (hidden session, polling, JSON parsing).
 */

import { useState, useCallback, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { ArrowUp, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { activeUserAtom, conductorUsersAtom } from '@/atoms/conductor'
import { useConductor } from '@/context/ConductorContext'
import { useAppShellContext } from '@/context/AppShellContext'
import { getConductorSystemPrompt } from '@/lib/conductor-prompt'
import { navigate, routes } from '@/lib/navigate'
import { toast } from 'sonner'
import type { ConductorTask, TaskExecutionTier, TaskPriority } from '@craft-agent/core/types'

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

export function ConductorIntentStrip() {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [reasoningMessage, setReasoningMessage] = useState<string | null>(null)
  const [inlineResult, setInlineResult] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeUser = useAtomValue(activeUserAtom)
  const users = useAtomValue(conductorUsersAtom)
  const { createTask, completeTask, findBestAssignee } = useConductor()
  const { activeWorkspaceId, onCreateSession, onSendMessage } = useAppShellContext()

  const resetState = useCallback(() => {
    setReasoningMessage(null)
    setInlineResult(null)
    setIsExecuting(false)
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
    resetState()
    const intent = input.trim()
    setInput('')

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
        toast.error('Coordinator timed out. Please try again.')
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
          setReasoningMessage(reasoning)

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
            setInlineResult(resultText)
            setIsExecuting(false)
          } else {
            setIsProcessing(false)
            setTimeout(() => {
              navigate(routes.view.conductor('myTasks', task.id))
            }, 2000)
            toast.success(`Task created: ${parsed.title}`)
          }
        } catch {
          toast.error('Could not parse coordinator response')
          setIsProcessing(false)
        }
      } else {
        setReasoningMessage(response)
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Intent submission failed:', error)
      toast.error('Failed to process your request')
      setIsProcessing(false)
    }
  }, [input, isProcessing, activeWorkspaceId, activeUser, users, onCreateSession, onSendMessage, createTask, completeTask, findBestAssignee, buildReasoningMessage, resetState])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const hasResponse = reasoningMessage || inlineResult

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Upper area: reasoning / result cards */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col items-center justify-center">
        {!hasResponse && !isProcessing && !isExecuting && (
          <div className="text-center max-w-md">
            <Sparkles className="h-8 w-8 text-accent/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground/60">
              What do you want to get done today?
            </p>
          </div>
        )}

        {reasoningMessage && (
          <div className="w-full max-w-lg rounded-xl border border-accent/20 bg-accent/[0.03] p-4 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-accent">Coordinator AI</span>
            </div>
            <p className="text-sm text-foreground/80">{reasoningMessage}</p>
          </div>
        )}

        {isExecuting && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>AI is working on it...</span>
          </div>
        )}

        {inlineResult && (
          <div className="w-full max-w-lg rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Done</span>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-6">{inlineResult}</p>
          </div>
        )}

        {hasResponse && !isExecuting && !isProcessing && (
          <button
            onClick={resetState}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Start a new request
          </button>
        )}
      </div>

      {/* Bottom-pinned input */}
      <div className="shrink-0 border-t border-foreground/5 px-4 py-3">
        <div className="relative max-w-lg mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to get done today?"
            className={cn(
              'w-full rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-2.5 pr-10',
              'text-sm text-foreground placeholder:text-muted-foreground/40',
              'resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40',
            )}
            disabled={isProcessing}
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors',
              input.trim() && !isProcessing
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-foreground/5 text-muted-foreground/40'
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
