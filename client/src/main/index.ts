import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, resolve } from 'path'
import { fork, ChildProcess } from 'child_process'
import net from 'net'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let serverProcess: ChildProcess | null = null

function checkPortInUse(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((res) => {
    const socket = new net.Socket()
    socket.setTimeout(1000)
    socket.on('connect', () => {
      socket.destroy()
      res(true)
    })
    socket.on('timeout', () => {
      socket.destroy()
      res(false)
    })
    socket.on('error', () => {
      res(false)
    })
    socket.connect(port, host)
  })
}

function loadEnvFile(envPath: string): Record<string, string> {
  const envVars: Record<string, string> = {}
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          envVars[key] = val
        }
      }
    })
  }
  return envVars
}

async function startBackendServer(): Promise<void> {
  const defaultPort = 5000
  const isRunning = await checkPortInUse(defaultPort)
  if (isRunning) {
    console.log(`Backend server is already running on port ${defaultPort}`)
    return
  }

  const rootDir = is.dev
    ? resolve(__dirname, '../../../')
    : process.resourcesPath

  const serverDir = is.dev ? join(rootDir, 'server') : join(rootDir, 'server')
  const envPath = join(serverDir, '.env')
  const serverScript = join(serverDir, 'src/server.js')

  const parsedEnv = loadEnvFile(envPath)
  const envVars = {
    ...process.env,
    ...parsedEnv,
    PORT: String(parsedEnv.PORT || defaultPort),
    NODE_ENV: process.env.NODE_ENV || 'production'
  }

  if (fs.existsSync(serverScript)) {
    console.log(`Starting background backend server from: ${serverScript}`)
    try {
      serverProcess = fork(serverScript, [], {
        cwd: serverDir,
        env: envVars,
        stdio: 'ignore'
      })

      serverProcess.on('error', (err) => {
        console.error('Failed to start backend process:', err)
      })

      serverProcess.on('exit', (code) => {
        console.log(`Backend server process exited with code ${code}`)
        serverProcess = null
      })
    } catch (err) {
      console.error('Error launching backend server:', err)
    }
  } else {
    console.warn(`Server script not found at ${serverScript}`)
  }
}

function stopBackendServer(): void {
  if (serverProcess) {
    console.log('Terminating background backend server process...')
    try {
      serverProcess.kill('SIGTERM')
    } catch (e) {
      console.error('Error killing backend server process:', e)
    }
    serverProcess = null
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'Viral Print Software — Desktop App',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.viralprint.software')

  // Automatically launch backend server in background
  await startBackendServer()

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  stopBackendServer()
})

app.on('will-quit', () => {
  stopBackendServer()
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  stopBackendServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

