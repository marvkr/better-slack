/**
 * DeadlineConversation - Conversational dialog for the 90% deadline check.
 *
 * Beat 3 of the demo: AI checks in with the assignee, who can decline,
 * triggering an automatic reassignment to the next best team member.
 */

import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { conductorUsersAtom } from '@/atoms/conductor'
import { useConductor } from '@/context/ConductorContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ConductorTask } from '@craft-agent/core/types'

interface DeadlineConversationProps {
  task: ConductorTask
  onDismiss: () => void
}

type ConversationStep = 'ask' | 'declined' | 'reassigning' | 'accepted'

function formatTimeLeft(deadline: number): string {
  const ms = deadline - Date.now()
  if (ms <= 0) return 'now'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function DeadlineConversation({ task, onDismiss }: DeadlineConversationProps) {
  const [step, setStep] = useState<ConversationStep>('ask')
  const users = useAtomValue(conductorUsersAtom)
  const { findBestAssignee, reassignTask } = useConductor()

  const assignee = users.find(u => u.id === task.assigneeId)
  const firstName = assignee?.name.split(' ')[0] ?? 'Team member'
  const timeLeft = task.deadline ? formatTimeLeft(task.deadline) : 'soon'

  const handleDecline = () => {
    setStep('declined')

    // Find next best assignee
    const excludeIds = [
      task.assigneeId ?? '',
      ...(task.escalationState?.previousAssigneeIds ?? []),
    ]
    const nextAssignee = findBestAssignee(task.requiredSkills, excludeIds)

    setTimeout(() => {
      setStep('reassigning')

      if (nextAssignee) {
        reassignTask(task.id, nextAssignee.id, 'Deadline reassignment — previous assignee unavailable')
      }

      // Auto-close after showing the reassignment message
      setTimeout(() => {
        onDismiss()
      }, 3000)
    }, 1200)
  }

  const handleAccept = () => {
    setStep('accepted')
    setTimeout(() => {
      onDismiss()
    }, 1500)
  }

  // Find the reassignment target for the message
  const excludeIds = [
    task.assigneeId ?? '',
    ...(task.escalationState?.previousAssigneeIds ?? []),
  ]
  const nextAssignee = findBestAssignee(task.requiredSkills, excludeIds)
  const nextCapacity = nextAssignee
    ? Math.round((1 - nextAssignee.currentTaskIds.length / nextAssignee.maxConcurrentTasks) * 100)
    : 0

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onDismiss() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Deadline Check-in</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* AI question */}
          <ChatBubble role="ai">
            Hey {firstName}, your task &ldquo;{task.title}&rdquo; is due in {timeLeft} &mdash; will you be able to finish in time?
          </ChatBubble>

          {/* Response buttons (initial step) */}
          {step === 'ask' && (
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={handleDecline}
                className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
              >
                No, can&apos;t finish
              </button>
              <button
                onClick={handleAccept}
                className="px-3 py-1.5 text-sm rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950 transition-colors"
              >
                Yes, almost done
              </button>
            </div>
          )}

          {/* User declined */}
          {(step === 'declined' || step === 'reassigning') && (
            <ChatBubble role="user">
              No, I won&apos;t be able to finish in time.
            </ChatBubble>
          )}

          {/* AI reassignment message */}
          {step === 'reassigning' && nextAssignee && (
            <ChatBubble role="ai">
              No worries. Reassigning to {nextAssignee.name} &mdash; same skill set, {nextCapacity}% capacity, available now. All stakeholders notified.
            </ChatBubble>
          )}

          {step === 'reassigning' && !nextAssignee && (
            <ChatBubble role="ai">
              No worries. Unfortunately no other team members are available right now. I&apos;ll flag this for manual review.
            </ChatBubble>
          )}

          {/* User accepted */}
          {step === 'accepted' && (
            <>
              <ChatBubble role="user">
                Yes, I&apos;m almost done!
              </ChatBubble>
              <ChatBubble role="ai">
                Great! Keep going &mdash; you&apos;ve got this.
              </ChatBubble>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ChatBubble({ role, children }: { role: 'ai' | 'user'; children: React.ReactNode }) {
  return (
    <div className={cn('flex gap-2.5 items-start', role === 'user' && 'flex-row-reverse')}>
      <div className={cn(
        'shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
        role === 'ai' ? 'bg-accent/10 text-accent' : 'bg-foreground/10 text-foreground/70'
      )}>
        {role === 'ai' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>
      <div className={cn(
        'rounded-xl px-3 py-2 text-sm max-w-[85%]',
        role === 'ai'
          ? 'bg-foreground/[0.03] border border-foreground/5 text-foreground/80'
          : 'bg-accent/10 text-foreground/80'
      )}>
        {children}
      </div>
    </div>
  )
}
