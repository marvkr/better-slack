// Icon cache utilities
import { useState, useEffect } from 'react'
import type { ResolvedEntityIcon } from './icons'

export const logoUrlCache = new Map<string, string>()
export const iconCache = new Map<string, ResolvedEntityIcon>()

export const EMOJI_ICON_PREFIX = 'emoji:'

export function clearSourceIconCaches(): void {
  logoUrlCache.clear()
  iconCache.clear()
}

export async function loadSourceIcon(sourceId: string): Promise<ResolvedEntityIcon | null> {
  const cached = iconCache.get(sourceId)
  if (cached) return cached
  return { kind: 'fallback', value: '' }
}

export async function loadSkillIcon(skillId: string): Promise<ResolvedEntityIcon | null> {
  const cached = iconCache.get(skillId)
  if (cached) return cached
  return { kind: 'fallback', value: '' }
}

export function getSourceIconSync(sourceId: string): ResolvedEntityIcon | null {
  return iconCache.get(sourceId) || null
}

export function getSkillIconSync(skillId: string): ResolvedEntityIcon | null {
  return iconCache.get(skillId) || null
}

export function useEntityIcon(icon?: { emoji?: string; file?: string } | null): ResolvedEntityIcon {
  const [resolvedIcon, setResolvedIcon] = useState<ResolvedEntityIcon>(() => {
    if (icon?.emoji) {
      return { kind: 'emoji', value: icon.emoji }
    }
    if (icon?.file) {
      return { kind: 'file', value: icon.file }
    }
    return { kind: 'fallback', value: '' }
  })

  useEffect(() => {
    if (icon?.emoji) {
      setResolvedIcon({ kind: 'emoji', value: icon.emoji })
    } else if (icon?.file) {
      setResolvedIcon({ kind: 'file', value: icon.file })
    } else {
      setResolvedIcon({ kind: 'fallback', value: '' })
    }
  }, [icon])

  return resolvedIcon
}
