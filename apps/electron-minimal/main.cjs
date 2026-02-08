/**
 * Minimal Electron Main Process for Dispatch
 * Just opens a window and loads the Vite dev server
 */

const { app, BrowserWindow } = require('electron')

let mainWindow = null

console.log('📍 Electron modules loaded:', { app: !!app, BrowserWindow: !!BrowserWindow })

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Dispatch',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Load the minimal Vite dev server (port 5174)
  mainWindow.loadURL('http://localhost:5174')

  // Open DevTools in development
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  console.log('✅ Dispatch window created!')
}

// Wait for app to be ready
app.whenReady().then(() => {
  console.log('✅ Electron app ready, creating window...')
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
