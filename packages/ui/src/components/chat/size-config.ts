/**
 * Global size configuration for TurnCard components.
 * Adjust these values to scale the entire component uniformly.
 */
export const SIZE_CONFIG = {
  /** Base font size class for all text */
  fontSize: 'text-[13px]',
  /** Icon size class (width and height) */
  iconSize: 'w-3 h-3',
  /** Spinner text size class */
  spinnerSize: 'text-[10px]',
  /** Small spinner for header */
  spinnerSizeSmall: 'text-[8px]',
  /** Activity row height in pixels (approx for calculation) */
  activityRowHeight: 24,
  /** Max visible activities before scrolling (show ~14 items) */
  maxVisibleActivities: 14,
  /** Number of items before which we apply staggered animation */
  staggeredAnimationLimit: 10,
} as const
