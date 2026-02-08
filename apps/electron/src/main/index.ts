// Simplified Dispatch Electron app - no workspaces, sessions, or MCP servers
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { registerIpcHandlers } from './ipc'
import { createApplicationMenu } from './menu'
import { WindowManager } from './window-manager'
import { loadWindowState, saveWindowState } from './window-state'
import log, { isDebugMode, mainLog, getLogFilePath } from './logger'
import { checkForUpdatesOnLaunch, setWindowManager as setAutoUpdateWindowManager, isUpdating } from './auto-update'

// Initialize electron-log for renderer process support
log.initialize()

// Set app name early (before app.whenReady) to ensure correct macOS menu bar title
if (app && app.setName) {
  app.setName('Dispatch')
}

let windowManager: WindowManager | null = null

// Helper to create initial window on startup
async function createInitialWindow(): Promise<void> {
  if (!windowManager) return

  // Load saved window state
  const savedState = loadWindowState()

  if (savedState?.windows.length) {
    // Restore window from saved state
    mainLog.info(`Restoring window: url=${savedState.windows[0].url ?? 'none'}`)
    const win = windowManager.createWindow({
      workspaceId: '', // No workspace system in Dispatch
      restoreUrl: savedState.windows[0].url,
    })
    win.setBounds(savedState.windows[0].bounds)
    mainLog.info('Restored window from saved state')
  } else {
    // Default: create a new window
    windowManager.createWindow({ workspaceId: '' })
    mainLog.info('Created new window')
  }
}

app.whenReady().then(async () => {
  // Set dock icon on macOS (required for dev mode, bundled apps use Info.plist)
  if (process.platform === 'darwin' && app.dock) {
    const dockIconPath = join(__dirname, '../resources/icon.png')
    if (existsSync(dockIconPath)) {
      app.dock.setIcon(dockIconPath)
    }
  }

  try {
    // Initialize window manager
    windowManager = new WindowManager()

    // Create the application menu
    createApplicationMenu(windowManager)

    // Register IPC handlers
    registerIpcHandlers(windowManager)

    // Create initial window
    await createInitialWindow()

    // Initialize auto-update (check immediately on launch)
    // Skip in dev mode to avoid replacing /Applications app and launching it instead
    setAutoUpdateWindowManager(windowManager)
    if (app.isPackaged) {
      checkForUpdatesOnLaunch().catch(err => {
        mainLog.error('[auto-update] Launch check failed:', err)
      })
    } else {
      mainLog.info('[auto-update] Skipping auto-update in dev mode')
    }

    mainLog.info('App initialized successfully')
    if (isDebugMode) {
      mainLog.info('Debug mode enabled - logs at:', getLogFilePath())
    }
  } catch (error) {
    mainLog.error('Failed to initialize app:', error)
    // Continue anyway - the app will show errors in the UI
  }

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (!windowManager?.hasWindows() && windowManager) {
      windowManager.createWindow({ workspaceId: '' })
    }
  })
})

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Track if we're in the process of quitting (to avoid re-entry)
let isQuitting = false

// Save window state and clean up resources before quitting
app.on('before-quit', async (event) => {
  // Avoid re-entry when we call app.exit()
  if (isQuitting) return
  isQuitting = true

  if (windowManager) {
    // Get full window states (includes bounds and query)
    const windows = windowManager.getWindowStates()

    saveWindowState({
      windows,
      lastFocusedWorkspaceId: undefined, // No workspace system
    })
    mainLog.info('Saved window state:', windows.length, 'window(s)')
  }

  // If update is in progress, let electron-updater handle the quit flow
  if (isUpdating()) {
    mainLog.info('Update in progress, letting electron-updater handle quit')
    app.quit()
    return
  }

  // Now actually quit
  app.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  mainLog.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  mainLog.error('Unhandled rejection at:', promise, 'reason:', reason)
})
