/**
 * WebSocket Client for Dispatch real-time updates
 * Connects to the WebSocket server running on localhost:3001/ws
 */

const WS_URL = 'ws://localhost:3001/ws'

type MessageHandler = (message: any) => void

let ws: WebSocket | null = null
let messageHandlers: Set<MessageHandler> = new Set()
let reconnectTimeout: number | null = null
let isIntentionallyClosed = false

/**
 * Get or create WebSocket connection
 */
export function getWebSocket(): WebSocket {
  if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
    connect()
  }
  return ws!
}

/**
 * Connect to WebSocket server
 */
function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return
  }

  isIntentionallyClosed = false

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('[WebSocket] Connected to backend')
      // Clear any pending reconnection
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        // Notify all registered handlers
        messageHandlers.forEach((handler) => handler(message))
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Connection error:', error)
    }

    ws.onclose = () => {
      console.log('[WebSocket] Connection closed')
      ws = null

      // Auto-reconnect if not intentionally closed
      if (!isIntentionallyClosed) {
        console.log('[WebSocket] Reconnecting in 3 seconds...')
        reconnectTimeout = window.setTimeout(() => {
          connect()
        }, 3000)
      }
    }
  } catch (error) {
    console.error('[WebSocket] Failed to connect:', error)
  }
}

/**
 * Subscribe to WebSocket messages
 */
export function subscribe(handler: MessageHandler): () => void {
  messageHandlers.add(handler)

  // Ensure connection is established
  getWebSocket()

  // Return unsubscribe function
  return () => {
    messageHandlers.delete(handler)
  }
}

/**
 * Close WebSocket connection
 */
export function closeWebSocket() {
  isIntentionallyClosed = true

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (ws) {
    ws.close()
    ws = null
  }

  messageHandlers.clear()
}

/**
 * Send a message through WebSocket
 */
export function sendMessage(message: any) {
  const socket = getWebSocket()
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  } else {
    console.warn('[WebSocket] Cannot send message, connection not open')
  }
}
