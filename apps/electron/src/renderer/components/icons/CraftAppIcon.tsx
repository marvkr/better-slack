import dispatchLogo from "@/assets/dispatch-logo.png"

interface CraftAppIconProps {
  className?: string
  size?: number
}

/**
 * CraftAppIcon - Displays the Dispatch logo
 */
export function CraftAppIcon({ className, size = 64 }: CraftAppIconProps) {
  return (
    <img
      src={dispatchLogo}
      alt="Dispatch"
      width={size}
      height={size}
      className={className}
    />
  )
}
