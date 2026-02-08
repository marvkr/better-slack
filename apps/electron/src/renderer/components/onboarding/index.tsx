// Onboarding components
import React from 'react'
import { Button } from '@/components/ui/button'
import dispatchLogo from '@/assets/dispatch-logo.png'

interface OnboardingWizardProps {
  onFinish?: () => void
  [key: string]: unknown
}

export function OnboardingWizard(props: OnboardingWizardProps) {
  const handleSkip = () => {
    console.log('Skip button clicked, calling onFinish')
    if (props.onFinish) {
      props.onFinish()
    } else {
      console.error('onFinish prop is not provided')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 gap-6">
      <img
        src={dispatchLogo}
        alt="Dispatch"
        className="w-16 h-16 object-contain"
      />
      <h1 className="text-4xl font-semibold">Dispatch</h1>
      <p className="text-center text-muted-foreground text-lg max-w-xl">
        AI-native task coordination. Express intent, not instructions.
      </p>
      <Button onClick={handleSkip} size="lg" className="rounded-full">
        Get Started
      </Button>
    </div>
  )
}

interface ReauthScreenProps {
  [key: string]: unknown
}

export function ReauthScreen(_props: ReauthScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-border bg-card">
        <h1 className="text-2xl font-semibold">Session Expired</h1>
        <p className="text-muted-foreground">Please re-authenticate</p>
      </div>
    </div>
  )
}
