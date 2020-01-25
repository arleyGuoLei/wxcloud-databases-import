'use strict'

import { app, BrowserWindow, globalShortcut } from 'electron'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 316,
    useContentSize: true,
    width: 248,
    maximizable: false,
    resizable: false,
    webPreferences: {
      webSecurity: false
    },
    frame: false,
    icon: `${__static}/logo.png`,
    center: true
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({mode: 'detach'})
  }
}
if (process.platform === 'darwin') {
  app.dock.setIcon(`${__static}/logo.png`)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('browser-window-focus', () => {
  if (!mainWindow) return

  if (process.platform === 'darwin') {
    let contents = mainWindow.webContents

    globalShortcut.register('CommandOrControl+C', () => {
      contents.copy()
    })

    globalShortcut.register('CommandOrControl+V', () => {
      contents.paste()
    })

    globalShortcut.register('CommandOrControl+X', () => {
      contents.cut()
    })

    globalShortcut.register('CommandOrControl+A', () => {
      contents.selectAll()
    })
  }
})

app.on('browser-window-blur', () => {
  globalShortcut.unregisterAll()
})
