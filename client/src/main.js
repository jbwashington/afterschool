import './styles/main.css'
import { Game } from './game/Game.js'
import { NetworkClient } from './network/NetworkClient.js'
import { UIManager } from './ui/UIManager.js'
import { AudioProcessor } from './audio/AudioProcessor.js'

class App {
  constructor() {
    this.game = null
    this.network = null
    this.ui = null
    this.audio = null
    this.roomId = null
    this.playerId = null
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

    // Update URL
    window.history.replaceState({}, '', `?room=${roomId}`)

    // Hide join modal
    this.ui.hideJoinModal()
    this.ui.showStatus('Connecting...', `Room: ${roomId}`)

    // Initialize game world
    const container = document.getElementById('three-canvas')
    this.game = new Game(container)
    await this.game.init()

    // Connect to server
    const wsUrl = `ws://${window.location.hostname}:3001?room=${roomId}`
    this.network = new NetworkClient(wsUrl)

    this.network.onConnected = (data) => this.handleConnected(data)
    this.network.onPlayerJoined = (data) => this.handlePlayerJoined(data)
    this.network.onPlayerLeft = (data) => this.handlePlayerLeft(data)
    this.network.onTurnStart = (data) => this.handleTurnStart(data)
    this.network.onTurnEnd = (data) => this.handleTurnEnd(data)
    this.network.onCardSelected = (data) => this.handleCardSelected(data)
    this.network.onWorldUpdate = (data) => this.handleWorldUpdate(data)
    this.network.onError = (data) => this.handleError(data)
    this.network.onDisconnected = () => this.handleDisconnected()

    this.network.connect()

    // Initialize audio processor
    this.audio = new AudioProcessor()
    this.audio.onSignal = (signal) => this.handleAudioSignal(signal)
  }

  handleConnected(data) {
    this.playerId = data.playerId
    this.ui.updatePlayerInfo(data.playerNumber, null, data.gameState.playerCount)

    // Load initial world state
    if (data.gameState.world) {
      this.game.loadWorld(data.gameState.world)
    }

    if (data.gameState.playerCount < 2) {
      this.ui.showStatus(
        'Waiting for another player...',
        `Share this link: ${window.location.href}`
      )
    } else if (data.gameState.phase !== 'waiting') {
      // Game already in progress
      this.handleTurnStart({
        turn: data.gameState.turn,
        phase: data.gameState.phase,
        cards: data.gameState.availableCards,
      })
    }
  }

  handlePlayerJoined(data) {
    this.ui.updatePlayerCount(data.playerCount)

    if (data.playerCount === 2) {
      this.ui.hideStatus()
    }
  }

  handlePlayerLeft(data) {
    this.ui.updatePlayerCount(data.playerCount)
    this.ui.showStatus(
      'Player left the game',
      'Waiting for another player to join...'
    )
  }

  handleTurnStart(data) {
    this.ui.hideStatus()
    this.ui.hideReflection()

    const myRole = data.roles?.[this.playerId]
    this.ui.updateTurnInfo(data.turn, data.phase, myRole)
    this.ui.showCards(data.cards, myRole)

    // Start audio listening on turn start
    if (!this.audio.isListening) {
      this.audio.startListening()
    }
  }

  handleTurnEnd(data) {
    this.ui.hideCards()
    this.ui.showReflection(data.prompt)
  }

  handleCardSelected(data) {
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

  handleError(data) {
    console.error('Server error:', data.message)
    this.ui.showStatus('Error', data.message)
  }

  handleDisconnected() {
    this.ui.showStatus('Disconnected', 'Trying to reconnect...')
    // Attempt reconnect after delay
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
    // Only send meaningful signals
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
