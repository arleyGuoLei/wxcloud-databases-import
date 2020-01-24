
import { BrowserWindow } from 'electron'

require('electron').app.on('ready', () => {
  BrowserWindow.addDevToolsExtension(require('path').resolve(__dirname, './../../.electron-vue/vue-devtools'))
})

// Require `main` process to boot app
require('./index')
