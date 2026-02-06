import './styles/main.css'
import { Game } from './game/Game.js'
import { NetworkClient } from './network/NetworkClient.js'
import { UIManager } from './ui/UIManager.js'
import { ControlPanel } from './ui/ControlPanel.js'
import { AudioProcessor } from './audio/AudioProcessor.js'

class App {
  constructor() {
    this.game = null
    this.network = null
    this.ui = null
    this.controlPanel = null
    this.audio = null
    this.roomId = null
    this.playerId = null
    this.mode = 'sandbox' // 'sandbox' or 'turns'
  }

  async init() {
    // Initialize UI
    this.ui = new UIManager()
    this.ui.onCreateRoom = () => this.createRoom()
    this.ui.onJoinRoom = (code) => this.joinRoom(code)
    this.ui.onSelectCard = (cardId) => this.selectCard(cardId)

    // Check URL for room ID
    const urlParams = new URLSearchParams(window.location.search)
    const roomFromUrl = urlParams.get('room') || window.location.hash.slice(1)
    this.mode = urlParams.get('mode') || 'sandbox'

    if (roomFromUrl) {
      this.joinRoom(roomFromUrl)
    }
  }

  createRoom() {
    const roomId = this.generateRoomId()
    this.joinRoom(roomId)
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async joinRoom(roomId) {
    this.roomId = roomId

    // Update URL with mode
    window.history.replaceState({}, '', `?room=${roomId}&mode=${this.mode}`)

    // Hide join modal
    this.ui.hideJoinModal()
    this.ui.showStatus('Connecting...', `Room: ${roomId}`)

    // Initialize game world
    const container = document.getElementById('three-canvas')
    this.game = new Game(container)
    await this.game.init()

    // Initialize control panel for sandbox mode
    if (this.mode === 'sandbox') {
      this.controlPanel = new ControlPanel((action) => this.handleControlPanelAction(action))
      const overlay = document.getElementById('ui-overlay')
      this.controlPanel.mount(overlay)
    }

    // Connect to server
    const wsUrl = `ws://${window.location.hostname}:3001?room=${roomId}&mode=${this.mode}`
    this.network = new NetworkClient(wsUrl)

    this.network.onConnected = (data) => this.handleConnected(data)
    this.network.onPlayerJoined = (data) => this.handlePlayerJoined(data)
    this.network.onPlayerLeft = (data) => this.handlePlayerLeft(data)
    this.network.onTurnStart = (data) => this.handleTurnStart(data)
    this.network.onTurnEnd = (data) => this.handleTurnEnd(data)
    this.network.onCardSelected = (data) => this.handleCardSelected(data)
    this.network.onWorldUpdate = (data) => this.handleWorldUpdate(data)
    this.network.onEntitySpawn = (data) => this.handleEntitySpawn(data)
    this.network.onSkyChange = (data) => this.handleSkyChange(data)
    this.network.onClearAll = () => this.handleClearAll()
    this.network.onError = (data) => this.handleError(data)
    this.network.onDisconnected = () => this.handleDisconnected()

    this.network.connect()

    // Initialize audio processor
    this.audio = new AudioProcessor()
    this.audio.onSignal = (signal) => this.handleAudioSignal(signal)
  }

  handleControlPanelAction(action) {
    // Apply locally for instant feedback
    if (action.type === 'spawn') {
      const entityData = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action.entity
      }
      this.game.spawnEntity(entityData)

      // Send to server for sync
      this.network.send({
        type: 'spawn_entity',
        entity: entityData,
      })
    } else if (action.type === 'change_sky') {
      this.game.changeSkyColor(action.color)

      this.network.send({
        type: 'change_sky',
        color: action.color,
      })
    } else if (action.type === 'clear_all') {
      this.game.clearAll()

      this.network.send({
        type: 'clear_all',
      })
    }
  }

  handleConnected(data) {
    this.playerId = data.playerId
    this.ui.updatePlayerInfo(data.playerNumber, null, data.gameState.playerCount)

    // Load initial world state
    if (data.gameState.world) {
      this.game.loadWorld(data.gameState.world)
    }

    // In sandbox mode, always show the control panel
    if (this.mode === 'sandbox') {
      this.ui.hideStatus()
      this.controlPanel?.show()

      // Start audio for sandbox mode too
      this.audio.startListening()
    } else {
      // Turn-based mode
      if (data.gameState.playerCount < 2) {
        this.ui.showStatus(
          'Waiting for another player...',
          `Share this link: ${window.location.href}`
        )
      } else if (data.gameState.phase !== 'waiting') {
        this.handleTurnStart({
          turn: data.gameState.turn,
          phase: data.gameState.phase,
          cards: data.gameState.availableCards,
        })
      }
    }
  }

  handlePlayerJoined(data) {
    this.ui.updatePlayerCount(data.playerCount)

    if (this.mode === 'turns' && data.playerCount === 2) {
      this.ui.hideStatus()
    }
  }

  handlePlayerLeft(data) {
    this.ui.updatePlayerCount(data.playerCount)

    if (this.mode === 'turns') {
      this.ui.showStatus(
        'Player left the game',
        'Waiting for another player to join...'
      )
    }
  }

  handleTurnStart(data) {
    if (this.mode !== 'turns') return

    this.ui.hideStatus()
    this.ui.hideReflection()

    const myRole = data.roles?.[this.playerId]
    this.ui.updateTurnInfo(data.turn, data.phase, myRole)
    this.ui.showCards(data.cards, myRole)

    if (!this.audio.isListening) {
      this.audio.startListening()
    }
  }

  handleTurnEnd(data) {
    if (this.mode !== 'turns') return
    this.ui.hideCards()
    this.ui.showReflection(data.prompt)
  }

  handleCardSelected(data) {
    if (this.mode !== 'turns') return
    this.ui.markCardSelected(data.cardId, data.playerId === this.playerId)

    if (data.selectionsCount === 2) {
      this.ui.setCardsDisabled(true)
      this.ui.setPhaseInstruction('Applying changes...')
    }
  }

  handleWorldUpdate(data) {
    if (data.features) {
      for (const { feature } of data.features) {
        this.game.applyFeature(feature)
      }
    }

    if (data.worldState) {
      this.game.syncWorld(data.worldState)
    }

    if (data.update) {
      this.game.applyUpdate(data.update)
    }
  }

  handleEntitySpawn(data) {
    // Another player spawned an entity - add it to our world
    if (data.playerId !== this.playerId) {
      this.game.spawnEntity(data.entity)
    }
  }

  handleSkyChange(data) {
    // Another player changed the sky
    if (data.playerId !== this.playerId) {
      this.game.changeSkyColor(data.color)
    }
  }

  handleClearAll() {
    this.game.clearAll()
  }

  handleError(data) {
    console.error('Server error:', data.message)
    this.ui.showStatus('Error', data.message)
  }

  handleDisconnected() {
    this.ui.showStatus('Disconnected', 'Trying to reconnect...')
    setTimeout(() => {
      if (this.roomId) {
        this.network.connect()
      }
    }, 3000)
  }

  selectCard(cardId) {
    this.network.send({
      type: 'select_card',
      cardId,
    })
  }

  handleAudioSignal(signal) {
    if (signal.peak > 0.3 || signal.volume > 0.2) {
      this.network.send({
        type: 'audio_signal',
        signal,
      })
    }
  }
}

// Start app
const app = new App()
app.init()
