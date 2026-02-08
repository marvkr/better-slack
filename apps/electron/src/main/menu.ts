// Simplified application menu for Dispatch
import { Menu, app, shell, BrowserWindow } from 'electron'
import type { WindowManager } from './window-manager'
import { mainLog } from './logger'

// Store reference for rebuilding menu
let cachedWindowManager: WindowManager | null = null

/**
 * Creates and sets the application menu.
 * Call rebuildMenu() when update state changes to refresh the menu.
 */
export function createApplicationMenu(windowManager: WindowManager): void {
  cachedWindowManager = windowManager
  rebuildMenu()
}

/**
 * Rebuilds the application menu with current update state.
 */
export async function rebuildMenu(): Promise<void> {
  if (!cachedWindowManager) return

  const isMac = process.platform === 'darwin'

  // On Windows/Linux, hide the native menu
  if (!isMac) {
    Menu.setApplicationMenu(null)
    return
  }

  // Get current update state
  const { getUpdateInfo, installUpdate, checkForUpdates } = await import('./auto-update')
  const updateInfo = getUpdateInfo()
  const updateReady = updateInfo.available && updateInfo.downloadState === 'ready'

  // Build the update menu item based on state
  const updateMenuItem: Electron.MenuItemConstructorOptions = updateReady
    ? {
        label: `Install Update…\t【${updateInfo.latestVersion}】`,
        click: async () => {
          await installUpdate()
        }
      }
    : {
        label: 'Check for Updates…',
        click: async () => {
          await checkForUpdates({ autoDownload: true })
        }
      }

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: 'Dispatch',
      submenu: [
        { role: 'about' as const, label: 'About Dispatch' },
        updateMenuItem,
        { type: 'separator' as const },
        { role: 'hide' as const, label: 'Hide Dispatch' },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const, label: 'Quit Dispatch' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        { type: 'separator' as const },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },

    // Edit menu (standard roles for text editing)
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { role: 'resetZoom' as const },
        // Dev tools only in development
        ...(!app.isPackaged ? [
          { type: 'separator' as const },
          { role: 'reload' as const },
          { role: 'forceReload' as const },
          { type: 'separator' as const },
          { role: 'toggleDevTools' as const }
        ] : [])
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const }
        ] : [])
      ]
    },

    // Debug menu (development only)
    ...(!app.isPackaged ? [{
      label: 'Debug',
      submenu: [
        {
          label: 'Check for Updates',
          click: async () => {
            const { checkForUpdates } = await import('./auto-update')
            const info = await checkForUpdates({ autoDownload: true })
            mainLog.info('[debug-menu] Update check result:', info)
          }
        },
        {
          label: 'Install Update',
          click: async () => {
            const { installUpdate } = await import('./auto-update')
            try {
              await installUpdate()
            } catch (err) {
              mainLog.error('[debug-menu] Install failed:', err)
            }
          }
        }
      ]
    }] : []),

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Help & Documentation',
          click: () => shell.openExternal('https://github.com/marvkr/better-slack')
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * Sends an IPC message to the focused renderer window.
 */
function sendToRenderer(channel: string): void {
  const win = BrowserWindow.getFocusedWindow()
  if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
    win.webContents.send(channel)
  }
}
