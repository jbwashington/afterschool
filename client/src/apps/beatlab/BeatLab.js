import { BaseApp } from '../BaseApp.js'
import { AudioEngine } from './components/AudioEngine.js'
import { Sequencer } from './components/Sequencer.js'
import { Lobby } from './components/Lobby.js'
import { BEATLAB_MESSAGE_TYPES, BEATLAB_CONFIG } from '../../../../shared/constants.js'
import './beatlab.css'

/**
 * BeatLab - Fruity Loops-inspired step sequencer with multiplayer music rooms
 */
export class BeatLab extends BaseApp {
  constructor(window, windowManager) {
    super(window, windowManager)

    this.audioEngine = new AudioEngine()
    this.sequencer = null
    this.lobby = null
    this.container = null

    // View state: 'lobby' or 'sequencer'
    this.currentView = 'lobby'

    // Multiplayer state
    this.ws = null
    this.isConnected = false
    this.currentRoomId = null
    this.currentRoomName = null
    this.playerId = null
    this.players = []

    // Server connection
    this.wsUrl = `ws://${window.location?.hostname || 'localhost'}:6767`
  }

  init() {
    super.init()

    // Add beatlab-window class
    this.window.element.classList.add('beatlab-window')

    // Create container
    this.container = document.createElement('div')
    this.container.className = 'beatlab-container'
    this.window.setContent(this.container)

    // Initialize audio engine
    this.audioEngine.init()

    // Connect to WebSocket server
    this.connectToServer()

    // Show lobby by default
    this.showLobby()
  }

  connectToServer() {
    try {
      this.ws = new WebSocket(this.wsUrl + '?app=beatlab')

      this.ws.onopen = () => {
        console.log('[BeatLab] Connected to server')
        this.isConnected = true
        this.requestRoomList()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleServerMessage(message)
        } catch (err) {
          console.error('[BeatLab] Failed to parse message:', err)
        }
      }

      this.ws.onclose = () => {
        console.log('[BeatLab] Disconnected from server')
        this.isConnected = false
      }

      this.ws.onerror = (err) => {
        console.error('[BeatLab] WebSocket error:', err)
      }
    } catch (err) {
      console.error('[BeatLab] Failed to connect:', err)
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case BEATLAB_MESSAGE_TYPES.ROOM_LIST:
        this.lobby?.setRooms(message.rooms || [])
        break

      case BEATLAB_MESSAGE_TYPES.ROOM_CREATED:
      case BEATLAB_MESSAGE_TYPES.ROOM_JOINED:
        this.playerId = message.playerId
        this.currentRoomId = message.roomId
        this.currentRoomName = message.roomName
        this.players = message.players || []
        this.showSequencer(true, message)
        break

      case BEATLAB_MESSAGE_TYPES.ROOM_STATE:
        if (this.sequencer) {
          this.sequencer.setPattern(message.pattern)
          this.sequencer.setTempo(message.tempo, false)
          if (message.isPlaying) {
            this.sequencer.play(false)
          } else {
            this.sequencer.stop(false)
          }
        }
        break

      case BEATLAB_MESSAGE_TYPES.PLAYER_JOINED:
        this.players = message.players || []
        this.sequencer?.setPlayers(this.players)
        break

      case BEATLAB_MESSAGE_TYPES.PLAYER_LEFT:
        this.players = message.players || []
        this.sequencer?.setPlayers(this.players)
        break

      case BEATLAB_MESSAGE_TYPES.PATTERN_UPDATE:
        if (message.playerId !== this.playerId && this.sequencer) {
          this.sequencer.setCell(message.track, message.step, message.value)
        }
        break

      case BEATLAB_MESSAGE_TYPES.TEMPO_CHANGE:
        if (message.playerId !== this.playerId && this.sequencer) {
          this.sequencer.setTempo(message.tempo, false)
        }
        break

      case BEATLAB_MESSAGE_TYPES.PLAY_STATE:
        if (message.playerId !== this.playerId && this.sequencer) {
          if (message.isPlaying) {
            this.sequencer.play(false)
          } else {
            this.sequencer.stop(false)
          }
        }
        break
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  requestRoomList() {
    this.send({ type: BEATLAB_MESSAGE_TYPES.ROOM_LIST })
  }

  showLobby() {
    this.currentView = 'lobby'
    this.container.innerHTML = ''

    this.lobby = new Lobby({
      onCreateRoom: (name) => this.createRoom(name),
      onJoinRoom: (roomId) => this.joinRoom(roomId),
      onRefresh: () => this.requestRoomList(),
      onSinglePlayer: () => this.showSequencer(false)
    })

    this.container.appendChild(this.lobby.render())

    // Request room list if connected
    if (this.isConnected) {
      this.requestRoomList()
    }
  }

  showSequencer(isMultiplayer = false, roomState = null) {
    this.currentView = 'sequencer'
    this.container.innerHTML = ''

    this.sequencer = new Sequencer(this.audioEngine, {
      isMultiplayer,
      roomName: this.currentRoomName || 'BeatLab',
      players: this.players,
      onPatternChange: (track, step, value) => {
        if (isMultiplayer) {
          this.send({
            type: BEATLAB_MESSAGE_TYPES.PATTERN_UPDATE,
            roomId: this.currentRoomId,
            track,
            step,
            value
          })
        }
      },
      onTempoChange: (tempo) => {
        if (isMultiplayer) {
          this.send({
            type: BEATLAB_MESSAGE_TYPES.TEMPO_CHANGE,
            roomId: this.currentRoomId,
            tempo
          })
        }
      },
      onPlayStateChange: (isPlaying) => {
        if (isMultiplayer) {
          this.send({
            type: BEATLAB_MESSAGE_TYPES.PLAY_STATE,
            roomId: this.currentRoomId,
            isPlaying
          })
        }
      },
      onLeave: () => this.leaveRoom()
    })

    this.container.appendChild(this.sequencer.render())

    // Apply initial state if provided
    if (roomState) {
      if (roomState.pattern) {
        this.sequencer.setPattern(roomState.pattern)
      }
      if (roomState.tempo) {
        this.sequencer.setTempo(roomState.tempo, false)
      }
    }
  }

  createRoom(name) {
    this.send({
      type: BEATLAB_MESSAGE_TYPES.CREATE_ROOM,
      roomName: name
    })
  }

  joinRoom(roomId) {
    this.send({
      type: BEATLAB_MESSAGE_TYPES.JOIN_ROOM,
      roomId
    })
  }

  leaveRoom() {
    if (this.currentRoomId) {
      this.send({
        type: BEATLAB_MESSAGE_TYPES.LEAVE_ROOM,
        roomId: this.currentRoomId
      })
    }

    this.currentRoomId = null
    this.currentRoomName = null
    this.playerId = null
    this.players = []

    if (this.sequencer) {
      this.sequencer.destroy()
      this.sequencer = null
    }

    this.showLobby()
  }

  onFocus() {
    // Resume audio context if suspended (browser autoplay policy)
    this.audioEngine.resume()
  }

  destroy() {
    // Stop sequencer
    if (this.sequencer) {
      this.sequencer.destroy()
    }

    // Leave room if in one
    if (this.currentRoomId) {
      this.send({
        type: BEATLAB_MESSAGE_TYPES.LEAVE_ROOM,
        roomId: this.currentRoomId
      })
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // Destroy audio engine
    this.audioEngine.destroy()

    super.destroy()
  }
}

// App definition for registry
export const BeatLabApp = {
  id: 'beatlab',
  title: 'BeatLab',
  icon: '🎹',
  defaultWidth: 580,
  defaultHeight: 420,
  resizable: true,
  menuItems: [],
  create: (window, windowManager) => {
    const app = new BeatLab(window, windowManager)
    app.init()
    return app
  }
}
