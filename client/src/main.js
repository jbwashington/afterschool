import './styles/main.css'
import { Desktop } from './os/Desktop.js'
import { Taskbar } from './os/Taskbar.js'
import { StartMenu } from './os/StartMenu.js'
import { WindowManager } from './os/WindowManager.js'
import { AppRegistry } from './apps/AppRegistry.js'
import { NotepadApp } from './apps/notepad/Notepad.js'
import { WinampApp } from './apps/winamp/Winamp.js'
import { KidsOnlyPortalApp } from './apps/kids-portal/KidsOnlyPortal.js'
import { MyComputerApp, MyDocumentsApp, RecycleBinApp } from './apps/system/SystemApps.js'
import { VirtualFileSystem } from './filesystem/VirtualFileSystem.js'
import { NetworkClient } from './network/NetworkClient.js'
import { CursorSync } from './multiplayer/CursorSync.js'
import { RemoteCursorManager } from './multiplayer/RemoteCursor.js'
import { MESSAGE_TYPES } from '../../shared/constants.js'

class SixSevenOS {
  constructor() {
    this.desktop = null
    this.taskbar = null
    this.startMenu = null
    this.windowManager = null
    this.appRegistry = null
    this.fileSystem = null
    this.network = null
    this.cursorSync = null
    this.remoteCursors = null
    this.playerId = null
    this.playerNumber = null
    this.roomId = null
  }

  async init() {
    // Get container
    const container = document.getElementById('os-container')
    if (!container) {
      console.error('OS container not found')
      return
    }

    // Initialize file system
    this.fileSystem = new VirtualFileSystem()
    this.fileSystem.init()

    // Initialize app registry
    this.appRegistry = new AppRegistry()
    this.registerApps()

    // Initialize desktop
    this.desktop = new Desktop(container, null)
    this.desktop.init()

    // Initialize taskbar
    this.taskbar = new Taskbar(null, () => this.toggleStartMenu())
    this.taskbar.init()

    // Initialize window manager
    this.windowManager = new WindowManager(this.desktop, this.taskbar, this.appRegistry)

    // Wire up components
    this.desktop.windowManager = this.windowManager
    this.taskbar.windowManager = this.windowManager

    // Initialize start menu
    this.startMenu = new StartMenu(this.windowManager, 'User')
    this.startMenu.init()

    // Initialize remote cursors
    this.remoteCursors = new RemoteCursorManager()

    // Check URL for room ID
    const urlParams = new URLSearchParams(window.location.search)
    const roomFromUrl = urlParams.get('room') || window.location.hash.slice(1)

    if (roomFromUrl) {
      this.joinRoom(roomFromUrl)
    } else {
      // Auto-create a room
      this.createRoom()
    }

    // Close start menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (this.startMenu.isOpen && !e.target.closest('.xp-start-menu') && !e.target.closest('.xp-start-button')) {
        this.startMenu.close()
      }
    })

    console.log('sixsevenOS initialized')
  }

  registerApps() {
    this.appRegistry.register('notepad', NotepadApp)
    this.appRegistry.register('winamp', WinampApp)
    this.appRegistry.register('kids_portal', KidsOnlyPortalApp)
    this.appRegistry.register('my_computer', MyComputerApp)
    this.appRegistry.register('my_documents', MyDocumentsApp)
    this.appRegistry.register('recycle_bin', RecycleBinApp)
  }

  toggleStartMenu() {
    this.startMenu.toggle()
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  createRoom() {
    const roomId = this.generateRoomId()
    this.joinRoom(roomId)
  }

  joinRoom(roomId) {
    this.roomId = roomId
    window.history.replaceState({}, '', `?room=${roomId}`)

    // Connect to server
    const wsUrl = `ws://${window.location.hostname}:6767?room=${roomId}`
    this.network = new NetworkClient(wsUrl)

    // Set up network handlers
    this.network.onConnected = (data) => this.handleConnected(data)
    this.network.onPlayerJoined = (data) => this.handlePlayerJoined(data)
    this.network.onPlayerLeft = (data) => this.handlePlayerLeft(data)
    this.network.onCursorMove = (data) => this.handleCursorMove(data)
    this.network.onCursorDown = (data) => this.handleCursorDown(data)
    this.network.onCursorUp = (data) => this.handleCursorUp(data)
    this.network.onError = (data) => this.handleError(data)
    this.network.onDisconnected = () => this.handleDisconnected()

    this.network.connect()
  }

  handleConnected(data) {
    this.playerId = data.playerId
    this.playerNumber = data.playerNumber
    console.log(`[os] Connected as Player ${this.playerNumber}`)

    // Start cursor sync
    this.cursorSync = new CursorSync(this.network, this.playerId)
    this.cursorSync.start()

    // Wire up window manager for multiplayer sync
    this.windowManager.onWindowOpen = (windowId, appId, x, y) => {
      this.network.send({
        type: MESSAGE_TYPES.WINDOW_OPEN,
        playerId: this.playerId,
        windowId,
        appId,
        x,
        y
      })
    }

    this.windowManager.onWindowClose = (windowId) => {
      this.network.send({
        type: MESSAGE_TYPES.WINDOW_CLOSE,
        playerId: this.playerId,
        windowId
      })
    }

    this.windowManager.onWindowMove = (windowId, x, y) => {
      this.network.send({
        type: MESSAGE_TYPES.WINDOW_MOVE,
        playerId: this.playerId,
        windowId,
        x,
        y
      })
    }

    // Show room code
    console.log(`Share this link: ${window.location.href}`)
  }

  handlePlayerJoined(data) {
    console.log(`[os] Player ${data.playerNumber} joined`)
    // Create a cursor for the new player
    this.remoteCursors.addCursor(data.playerId, data.playerNumber, `Player ${data.playerNumber}`)
  }

  handlePlayerLeft(data) {
    console.log(`[os] Player left`)
    this.remoteCursors.removeCursor(data.playerId)
  }

  handleCursorMove(data) {
    if (data.playerId === this.playerId) return

    // Add cursor if doesn't exist
    if (!this.remoteCursors.getCursor(data.playerId)) {
      this.remoteCursors.addCursor(data.playerId, data.playerNumber || 0, `Player`)
    }

    this.remoteCursors.updateCursor(data.playerId, data.x, data.y)
  }

  handleCursorDown(data) {
    if (data.playerId === this.playerId) return
    this.remoteCursors.setCursorClicking(data.playerId, true)
  }

  handleCursorUp(data) {
    if (data.playerId === this.playerId) return
    this.remoteCursors.setCursorClicking(data.playerId, false)
  }

  handleError(data) {
    console.error('[os] Server error:', data.message)
  }

  handleDisconnected() {
    console.log('[os] Disconnected from server')
    // Cursor sync will be restarted on reconnect
    if (this.cursorSync) {
      this.cursorSync.stop()
    }
  }
}

// Start the OS
const os = new SixSevenOS()
os.init()
