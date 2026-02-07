/**
 * UserSwitcher - Avatar circles for switching between hardcoded users.
 * Displayed in the sidebar header area.
 */

import { useAtomValue, useSetAtom } from 'jotai'
import { cn } from '@/lib/utils'
import { conductorUsersAtom, activeUserIdAtom } from '@/atoms/conductor'
import { getUserInitials, USER_COLORS } from '@/config/conductor-users'
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui'

export function UserSwitcher() {
  const users = useAtomValue(conductorUsersAtom)
  const activeUserId = useAtomValue(activeUserIdAtom)
  const setActiveUserId = useSetAtom(activeUserIdAtom)

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5">
      {users.map((user) => {
        const isActive = user.id === activeUserId
        const color = USER_COLORS[user.id] ?? '#6b7280'
        const initials = getUserInitials(user.name)

        return (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveUserId(user.id)}
                className={cn(
                  'relative flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                  'h-8 w-8 shrink-0',
                  isActive
                    ? 'ring-2 ring-accent ring-offset-1 ring-offset-background scale-110'
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                )}
                style={{ backgroundColor: color, color: '#fff' }}
              >
                {initials}
                {isActive && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="font-medium">{user.name}</span>
              <span className="text-muted-foreground ml-1">· {user.role}</span>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
