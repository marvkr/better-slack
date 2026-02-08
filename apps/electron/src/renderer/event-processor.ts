// Event processor stub
export interface AgentEvent {
  type: string
  data?: any
}

export interface Effect {
  type: string
  payload?: any
}

export function useEventProcessor() {
  return {
    processEvent: (event: AgentEvent) => {
      // Stub implementation
    },
    effects: [] as Effect[],
  }
}
