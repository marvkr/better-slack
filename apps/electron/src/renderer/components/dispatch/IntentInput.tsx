/**
 * IntentInput - "What do you need?" input for submitting intents to the coordinator AI.
 * Handles sending the intent, parsing the coordinator's JSON response, and creating tasks.
 *
 * Demo features:
 * - Inline AI reasoning card (skill match, capacity, anonymity)
 * - Inline result display for ai_direct tasks with green "Done" badge
 * - Suggestion chips aligned to demo beats
 */

import { useState, useCallback, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { activeUserAtom, dispatchUsersAtom } from '@/atoms/dispatch'
import { useDispatch } from '@/context/DispatchContext'
import { useAppShellContext } from '@/context/AppShellContext'
import { getDispatchSystemPrompt } from '@/lib/dispatch-prompt'
import { navigate, routes } from '@/lib/navigate'
import { toast } from 'sonner'
import type { DispatchTask, TaskExecutionTier, TaskPriority } from '@craft-agent/core/types'

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

const SUGGESTION_CHIPS = [
  'I need a summary of last week\'s onboarding metrics by Friday',
  'Write a 3-paragraph team update about our shipping milestone',
  'Design a landing page for our enterprise launch',
]

export function IntentInput() {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [reasoningMessage, setReasoningMessage] = useState<string | null>(null)
  const [inlineResult, setInlineResult] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeUser = useAtomValue(activeUserAtom)
  const users = useAtomValue(dispatchUsersAtom)
  const { createTask, completeTask, findBestAssignee } = useDispatch()
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

    // Calculate skill match percentage
    const matchedSkills = parsed.requiredSkills.filter(s =>
      users.find(u => u.id === parsed.assigneeId)?.skills.includes(s)
    )
    const skillMatch = parsed.requiredSkills.length > 0
      ? Math.round((matchedSkills.length / parsed.requiredSkills.length) * 100)
      : 0

    // Calculate capacity percentage
    const user = users.find(u => u.id === parsed.assigneeId)
    const capacity = user
      ? Math.round((1 - user.currentTaskIds.length / user.maxConcurrentTasks) * 100)
      : 0

    return `Assigning to ${assignee.name} (${assignee.role}, ${skillMatch}% skill match, ${capacity}% capacity). ${assignee.name.split(' ')[0]} won't know it's from you — keeping it anonymous to remove bias.`
  }, [users])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isProcessing || !activeWorkspaceId) return

    setIsProcessing(true)
    resetState()
    const intent = input.trim()
    setInput('')

    try {
      // Create a hidden session for the coordinator
      const session = await onCreateSession(activeWorkspaceId, {
        hidden: true,
        systemPromptPreset: 'default',
        permissionMode: 'allow-all',
      })

      // Build the coordinator prompt with current team state
      const coordinatorPrompt = getDispatchSystemPrompt(users)

      // Send the intent wrapped in coordinator instructions
      const message = `${coordinatorPrompt}\n\n---\n\nUser intent from ${activeUser.name} (${activeUser.role}):\n"${intent}"`

      await onSendMessage(session.id, message)

      // Poll for response
      let attempts = 0
      const maxAttempts = 60

      const pollForResponse = async (): Promise<string | null> => {
        while (attempts < maxAttempts) {
          attempts++
          await new Promise(resolve => setTimeout(resolve, 500))

          const sessionData = await window.electronAPI.getSessionMessages(session.id)
          if (!sessionData) continue

          const assistantMsg = sessionData.messages.findLast(m => m.role === 'assistant')
          if (!assistantMsg?.content) continue

          if (!sessionData.isProcessing) {
            return assistantMsg.content
          }
        }
        return null
      }

      const response = await pollForResponse()

      if (!response) {
        toast.error('Coordinator timed out. Please try again.')
        setIsProcessing(false)
        return
      }

      // Try to parse JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed: CoordinatorResponse = JSON.parse(jsonMatch[0])

          // Determine assignee
          let assigneeId = parsed.assigneeId
          if (!assigneeId && parsed.executionTier === 'human') {
            const best = findBestAssignee(parsed.requiredSkills)
            assigneeId = best?.id
          }

          // Build and show reasoning message
          const assigneeUser = assigneeId ? users.find(u => u.id === assigneeId) : null
          const reasoning = buildReasoningMessage(parsed, assigneeUser ? { name: assigneeUser.name, role: assigneeUser.role } : null)
          setReasoningMessage(reasoning)

          // Create the task
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

          // For AI direct execution, show result inline
          if (parsed.executionTier === 'ai_direct') {
            setIsExecuting(true)
            setIsProcessing(false) // Allow seeing the reasoning while AI works

            const aiSession = await onCreateSession(activeWorkspaceId, {
              hidden: true,
              permissionMode: 'allow-all',
            })

            await onSendMessage(aiSession.id, intent)

            // Poll for AI result
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
            // For human/ai_agent tasks, navigate to the task after a brief pause
            setIsProcessing(false)
            setTimeout(() => {
              navigate(routes.view.dispatch('myTasks', task.id))
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
    <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">What do you need?</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe what you need done. The AI will figure out who should do it — or handle it directly.
        </p>
      </div>

      {/* Input */}
      <div className="w-full relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., I need a summary of last week's onboarding metrics by Friday..."
          className={cn(
            'w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 pr-12',
            'text-sm text-foreground placeholder:text-muted-foreground/50',
            'resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50',
            'min-h-[100px]',
          )}
          disabled={isProcessing}
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className={cn(
            'absolute bottom-3 right-3 p-2 rounded-lg transition-colors',
            input.trim() && !isProcessing
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-foreground/5 text-muted-foreground/50'
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* AI Reasoning Card */}
      {reasoningMessage && (
        <div className="w-full mt-4 rounded-xl border border-accent/20 bg-accent/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">Coordinator AI</span>
          </div>
          <p className="text-sm text-foreground/80">{reasoningMessage}</p>
        </div>
      )}

      {/* Inline execution spinner */}
      {isExecuting && (
        <div className="w-full mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>AI is working on it...</span>
        </div>
      )}

      {/* Inline Result (for ai_direct tasks) */}
      {inlineResult && (
        <div className="w-full mt-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Done</span>
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{inlineResult}</p>
        </div>
      )}

      {/* Suggestion chips */}
      {!isProcessing && !hasResponse && (
        <div className="flex flex-wrap gap-2 mt-6">
          {SUGGESTION_CHIPS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full border border-foreground/10 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Reset button when showing results */}
      {hasResponse && !isExecuting && !isProcessing && (
        <button
          onClick={resetState}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Start a new request
        </button>
      )}
    </div>
  )
}
