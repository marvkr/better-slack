/**
 * Auto-update module using electron-updater
 *
 * Handles checking for updates, downloading, and installing via the standard
 * electron-updater library. Updates are served from https://agents.craft.do/electron/latest
 * using the generic provider (YAML manifests + binaries on R2/S3).
 *
 * Platform behavior:
 * - macOS: Downloads zip, extracts and swaps app bundle atomically
 * - Windows: Downloads NSIS installer, runs silently on quit
 * - Linux: Downloads AppImage, replaces current file
 *
 * All platforms: quitAndInstall() handles restart natively — no external scripts.
 */

import { app } from 'electron'
import { mainLog } from './logger'
import type { UpdateInfo } from '../shared/types'
import type { WindowManager } from './window-manager'
import type { AppUpdater } from 'electron-updater'

// Simple version helper (replaces @craft-agent/shared/version)
const getAppVersion = () => app.getVersion()

// Stub dismissed update tracking (simplified, no persistence)
let dismissedVersion: string | null = null
const getDismissedUpdateVersion = () => dismissedVersion
const clearDismissedUpdateVersion = () => { dismissedVersion = null }

// Module state — keeps track of update info for IPC queries
let updateInfo: UpdateInfo = {
  available: false,
  currentVersion: getAppVersion(),
  latestVersion: null,
  downloadState: 'idle',
  downloadProgress: 0,
}

let windowManager: WindowManager | null = null

// Flag to indicate update is in progress — used to prevent force exit during quitAndInstall
let __isUpdating = false

// Lazy-loaded autoUpdater to avoid app.getVersion() call before app is ready
let autoUpdater: AppUpdater | null = null

/**
 * Initialize the autoUpdater after the app is ready
 */
async function getAutoUpdater(): Promise<AppUpdater> {
  if (autoUpdater) return autoUpdater

  const { autoUpdater: updater } = await import('electron-updater')
  autoUpdater = updater

  // Configure electron-updater
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = {
    info: (msg: unknown) => mainLog.info('[electron-updater]', msg),
    warn: (msg: unknown) => mainLog.warn('[electron-updater]', msg),
    error: (msg: unknown) => mainLog.error('[electron-updater]', msg),
    debug: (msg: unknown) => mainLog.info('[electron-updater:debug]', msg),
  }

  // Set up event handlers
  setupAutoUpdaterEvents()

  return autoUpdater
}

/**
 * Check if an update installation is in progress.
 * Used by main process to avoid force-quitting during update.
 */
export function isUpdating(): boolean {
  return __isUpdating
}

/**
 * Set the window manager for broadcasting update events to renderer windows
 */
export function setWindowManager(wm: WindowManager): void {
  windowManager = wm
}

/**
 * Get current update info (called by IPC handler)
 */
export function getUpdateInfo(): UpdateInfo {
  return { ...updateInfo }
}

/**
 * Broadcast update info to all renderer windows.
 * Creates a snapshot to avoid race conditions during broadcast.
 */
function broadcastUpdateInfo(): void {
  if (!windowManager) return

  const snapshot = { ...updateInfo }
  const windows = windowManager.getAllWindows()
  for (const { window } of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send('update:available', snapshot)
    }
  }
}

/**
 * Broadcast download progress to all renderer windows.
 */
function broadcastDownloadProgress(progress: number): void {
  if (!windowManager) return

  const windows = windowManager.getAllWindows()
  for (const { window } of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send('update:downloadProgress', progress)
    }
  }
}

/**
 * Set up event handlers for autoUpdater
 */
function setupAutoUpdaterEvents(): void {
  if (!autoUpdater) return

  autoUpdater.on('checking-for-update', () => {
    mainLog.info('[auto-update] Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    mainLog.info(`[auto-update] Update available: ${updateInfo.currentVersion} → ${info.version}`)

    updateInfo = {
      ...updateInfo,
      available: true,
      latestVersion: info.version,
      downloadState: 'downloading',
      downloadProgress: 0,
    }
    broadcastUpdateInfo()
  })

  autoUpdater.on('update-not-available', (info) => {
    mainLog.info(`[auto-update] Already up to date (${info.version})`)

    updateInfo = {
      ...updateInfo,
      available: false,
      latestVersion: info.version,
      downloadState: 'idle',
    }
    broadcastUpdateInfo()
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    updateInfo = { ...updateInfo, downloadProgress: percent }
    broadcastDownloadProgress(percent)
  })

  autoUpdater.on('update-downloaded', async (info) => {
    mainLog.info(`[auto-update] Update downloaded: v${info.version}`)

    updateInfo = {
      ...updateInfo,
      available: true,
      latestVersion: info.version,
      downloadState: 'ready',
      downloadProgress: 100,
    }
    broadcastUpdateInfo()

    // Rebuild menu to show "Install Update..." option
    const { rebuildMenu } = await import('./menu')
    rebuildMenu()
  })

  autoUpdater.on('error', (error) => {
    mainLog.error('[auto-update] Error:', error.message)

    updateInfo = {
      ...updateInfo,
      downloadState: 'error',
      error: error.message,
    }
    broadcastUpdateInfo()
  })
}

// ─── Exported API ─────────────────────────────────────────────────────────────

/**
 * Options for checkForUpdates
 */
interface CheckOptions {
  /** If true, automatically start download when update is found (default: true) */
  autoDownload?: boolean
}

/**
 * Check for available updates.
 * Returns the current UpdateInfo state after check completes.
 *
 * @param options.autoDownload - If false, only checks without downloading (for manual "Check Now")
 */
export async function checkForUpdates(options: CheckOptions = {}): Promise<UpdateInfo> {
  const { autoDownload = true } = options

  const updater = await getAutoUpdater()

  // Temporarily override autoDownload for this check if needed
  // (e.g., manual check from settings shouldn't auto-download on metered connections)
  const previousAutoDownload = updater.autoDownload
  updater.autoDownload = autoDownload

  try {
    await updater.checkForUpdates()
  } catch (error) {
    mainLog.error('[auto-update] Check failed:', error)
    updateInfo = {
      ...updateInfo,
      downloadState: 'error',
      error: error instanceof Error ? error.message : 'Check failed',
    }
  } finally {
    // Restore previous autoDownload setting
    updater.autoDownload = previousAutoDownload
  }

  return getUpdateInfo()
}

/**
 * Install the downloaded update and restart the app.
 * Calls electron-updater's quitAndInstall which handles:
 * - macOS: Extracts zip and swaps app bundle
 * - Windows: Runs NSIS installer silently
 * - Linux: Replaces AppImage file
 * Then relaunches the app automatically.
 */
export async function installUpdate(): Promise<void> {
  if (updateInfo.downloadState !== 'ready') {
    throw new Error('No update ready to install')
  }

  mainLog.info('[auto-update] Installing update and restarting...')

  updateInfo = { ...updateInfo, downloadState: 'installing' }
  broadcastUpdateInfo()

  // Clear dismissed version since user is explicitly updating
  clearDismissedUpdateVersion()

  // Set flag to prevent force exit from breaking electron-updater's shutdown sequence
  __isUpdating = true

  const updater = await getAutoUpdater()

  try {
    // isSilent=false shows the installer UI on Windows if needed (fallback)
    // isForceRunAfter=true ensures the app relaunches after install
    updater.quitAndInstall(false, true)
  } catch (error) {
    __isUpdating = false
    mainLog.error('[auto-update] quitAndInstall failed:', error)
    updateInfo = { ...updateInfo, downloadState: 'error' }
    broadcastUpdateInfo()
    throw error
  }
}

/**
 * Result of update check on launch
 */
export interface UpdateOnLaunchResult {
  action: 'none' | 'skipped' | 'ready' | 'downloading'
  reason?: string
  version?: string | null
}

/**
 * Check for updates on app launch.
 * - Checks immediately (no delay)
 * - Respects dismissed version (skips notification but allows manual check)
 * - Auto-downloads if update available
 */
export async function checkForUpdatesOnLaunch(): Promise<UpdateOnLaunchResult> {
  mainLog.info('[auto-update] Checking for updates on launch...')

  const info = await checkForUpdates({ autoDownload: true })

  if (!info.available) {
    return { action: 'none' }
  }

  // Check if this version was dismissed by user
  const dismissedVersion = getDismissedUpdateVersion()
  if (dismissedVersion === info.latestVersion) {
    mainLog.info(`[auto-update] Update ${info.latestVersion} was dismissed, skipping notification`)
    return { action: 'skipped', reason: 'dismissed', version: info.latestVersion }
  }

  if (info.downloadState === 'ready') {
    return { action: 'ready', version: info.latestVersion }
  }

  // Download in progress — will notify when ready via update-downloaded event
  return { action: 'downloading', version: info.latestVersion }
}
