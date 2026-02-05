import { GAME, MESSAGE_TYPES } from '../../shared/constants.js'
import { FeatureRegistry } from '../features/FeatureRegistry.js'
import { GameState } from './GameState.js'

export class Room {
  constructor(roomId) {
    this.id = roomId
    this.players = new Map()
    this.gameState = new GameState()
    this.featureRegistry = new FeatureRegistry()
    this.currentTurn = 0
    this.currentPhase = 'waiting' // waiting, plan, resolve, reflect
    this.cardSelections = new Map()
    this.availableCards = []
  }

  get playerCount() {
    return this.players.size
  }

  addPlayer(ws) {
    if (this.players.size >= GAME.MAX_PLAYERS) {
      return null
    }

    const playerNumber = this.players.size + 1
    const player = {
      id: `player_${playerNumber}_${Date.now()}`,
      number: playerNumber,
      ws,
      role: playerNumber === 1 ? 'designer' : 'tester',
    }

    this.players.set(player.id, player)

    // Start game when 2 players join
    if (this.players.size === GAME.MAX_PLAYERS) {
      this.startGame()
    }

    return player
  }

  removePlayer(playerId) {
    this.players.delete(playerId)

    // Reset game if a player leaves
    if (this.currentPhase !== 'waiting') {
      this.currentPhase = 'waiting'
      this.broadcast({
        type: MESSAGE_TYPES.GAME_STATE,
        state: this.getState(),
        message: 'Game paused - waiting for second player',
      })
    }
  }

  startGame() {
    console.log(`[game] Starting game in room ${this.id}`)
    this.currentTurn = 1
    this.startPlanPhase()
  }

  startPlanPhase() {
    this.currentPhase = 'plan'
    this.cardSelections.clear()

    // Generate feature cards for this turn
    this.availableCards = this.featureRegistry.generateCards(
      this.gameState,
      this.currentTurn
    )

    this.broadcast({
      type: MESSAGE_TYPES.TURN_START,
      turn: this.currentTurn,
      phase: 'plan',
      cards: this.availableCards,
      roles: this.getRoles(),
    })
  }

  getRoles() {
    const roles = {}
    for (const [id, player] of this.players) {
      // Alternate roles each turn
      const isDesigner = (player.number + this.currentTurn) % 2 === 0
      roles[id] = isDesigner ? 'designer' : 'tester'
      player.role = roles[id]
    }
    return roles
  }

  selectCard(playerId, cardId) {
    if (this.currentPhase !== 'plan') {
      return
    }

    const card = this.availableCards.find(c => c.id === cardId)
    if (!card) {
      return
    }

    this.cardSelections.set(playerId, cardId)

    // Broadcast selection to all players
    this.broadcast({
      type: MESSAGE_TYPES.CARD_SELECTED,
      playerId,
      cardId,
      selectionsCount: this.cardSelections.size,
    })

    // Check if both players have selected
    if (this.cardSelections.size === GAME.MAX_PLAYERS) {
      this.startResolvePhase()
    }
  }

  startResolvePhase() {
    this.currentPhase = 'resolve'

    // Apply selected cards
    const appliedFeatures = []
    for (const [playerId, cardId] of this.cardSelections) {
      const card = this.availableCards.find(c => c.id === cardId)
      if (card) {
        const feature = this.featureRegistry.applyCard(card, this.gameState)
        if (feature) {
          appliedFeatures.push({ playerId, card, feature })
        }
      }
    }

    this.broadcast({
      type: MESSAGE_TYPES.WORLD_UPDATE,
      phase: 'resolve',
      features: appliedFeatures,
      worldState: this.gameState.serialize(),
    })

    // After a delay, move to reflect phase
    setTimeout(() => this.startReflectPhase(), 2000)
  }

  startReflectPhase() {
    this.currentPhase = 'reflect'

    this.broadcast({
      type: MESSAGE_TYPES.TURN_END,
      turn: this.currentTurn,
      phase: 'reflect',
      prompt: this.generateReflectionPrompt(),
    })

    // After reflection, start next turn
    setTimeout(() => {
      this.currentTurn++
      this.startPlanPhase()
    }, 3000)
  }

  generateReflectionPrompt() {
    const prompts = [
      "What did you notice when the new feature appeared?",
      "How does our town look now?",
      "What would you like to add next?",
      "Did something surprising happen?",
    ]
    return prompts[Math.floor(Math.random() * prompts.length)]
  }

  handleAudioSignal(playerId, signal) {
    // Process audio signal (volume, peak, rhythm)
    const worldUpdate = this.gameState.processAudioSignal(playerId, signal)

    if (worldUpdate) {
      this.broadcast({
        type: MESSAGE_TYPES.WORLD_UPDATE,
        source: 'audio',
        playerId,
        update: worldUpdate,
      })
    }
  }

  getState() {
    return {
      roomId: this.id,
      playerCount: this.playerCount,
      turn: this.currentTurn,
      phase: this.currentPhase,
      world: this.gameState.serialize(),
      availableCards: this.availableCards,
    }
  }

  broadcast(message, excludeWs = null) {
    const data = JSON.stringify(message)
    for (const player of this.players.values()) {
      if (player.ws !== excludeWs && player.ws.readyState === 1) {
        player.ws.send(data)
      }
    }
  }
}
