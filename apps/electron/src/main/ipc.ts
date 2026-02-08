// Simplified IPC handlers for Dispatch - minimal app settings and window management
import { app, ipcMain, nativeTheme, shell, BrowserWindow } from 'electron'
import { ipcLog } from './logger'
import { WindowManager } from './window-manager'

// Simple type definitions for IPC
export const IPC_CHANNELS = {
  // App settings
  GET_APP_VERSION: 'get-app-version',
  GET_THEME: 'get-theme',
  SET_THEME: 'set-theme',

  // Window management
  CLOSE_WINDOW: 'close-window',
  MINIMIZE_WINDOW: 'minimize-window',
  MAXIMIZE_WINDOW: 'maximize-window',

  // External links
  OPEN_EXTERNAL: 'open-external',
} as const

/**
 * Register all IPC handlers for the main process
 */
export function registerIpcHandlers(windowManager: WindowManager): void {
  // ============================================
  // APP SETTINGS
  // ============================================

  ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, () => {
    return app.getVersion()
  })

  ipcMain.handle(IPC_CHANNELS.GET_THEME, () => {
    return nativeTheme.themeSource
  })

  ipcMain.handle(IPC_CHANNELS.SET_THEME, (_event, theme: 'system' | 'light' | 'dark') => {
    nativeTheme.themeSource = theme
    ipcLog.info(`Theme set to: ${theme}`)
  })

  // ============================================
  // WINDOW MANAGEMENT
  // ============================================

  ipcMain.handle(IPC_CHANNELS.CLOSE_WINDOW, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  ipcMain.handle(IPC_CHANNELS.MINIMIZE_WINDOW, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.MAXIMIZE_WINDOW, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  // ============================================
  // EXTERNAL LINKS
  // ============================================

  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, async (_event, url: string) => {
    await shell.openExternal(url)
  })

  ipcLog.info('IPC handlers registered')
}
