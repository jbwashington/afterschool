import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Room } from '../server/rooms/Room.js'
import { GAME } from '../shared/constants.js'

// Mock WebSocket
const createMockWs = () => ({
  send: vi.fn(),
  readyState: 1, // OPEN
})

describe('Room', () => {
  let room

  beforeEach(() => {
    room = new Room('test-room')
  })

  describe('player management', () => {
    it('should add first player', () => {
      const ws = createMockWs()
      const player = room.addPlayer(ws)

      expect(player).not.toBeNull()
      expect(player.number).toBe(1)
      expect(room.playerCount).toBe(1)
    })

    it('should add second player', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      room.addPlayer(ws1)
      const player2 = room.addPlayer(ws2)

      expect(player2).not.toBeNull()
      expect(player2.number).toBe(2)
      expect(room.playerCount).toBe(2)
    })

    it('should reject third player', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()
      const ws3 = createMockWs()

      room.addPlayer(ws1)
      room.addPlayer(ws2)
      const player3 = room.addPlayer(ws3)

      expect(player3).toBeNull()
      expect(room.playerCount).toBe(2)
    })

    it('should remove player correctly', () => {
      const ws = createMockWs()
      const player = room.addPlayer(ws)

      room.removePlayer(player.id)
      expect(room.playerCount).toBe(0)
    })
  })

  describe('game flow', () => {
    it('should start game when 2 players join', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      room.addPlayer(ws1)
      room.addPlayer(ws2)

      expect(room.currentTurn).toBe(1)
      expect(room.currentPhase).toBe('plan')
    })

    it('should generate cards at start of plan phase', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      room.addPlayer(ws1)
      room.addPlayer(ws2)

      expect(room.availableCards.length).toBeGreaterThanOrEqual(2)
      expect(room.availableCards.length).toBeLessThanOrEqual(4)
    })

    it('should pause game when player leaves', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      const player1 = room.addPlayer(ws1)
      room.addPlayer(ws2)

      expect(room.currentPhase).toBe('plan')

      room.removePlayer(player1.id)
      expect(room.currentPhase).toBe('waiting')
    })
  })

  describe('role switching', () => {
    it('should assign different roles to players', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      const player1 = room.addPlayer(ws1)
      const player2 = room.addPlayer(ws2)

      const roles = room.getRoles()
      const roleValues = Object.values(roles)

      expect(roleValues).toContain('designer')
      expect(roleValues).toContain('tester')
    })

    it('should alternate roles between turns', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      const player1 = room.addPlayer(ws1)
      room.addPlayer(ws2)

      const turn1Roles = room.getRoles()
      const player1Role1 = turn1Roles[player1.id]

      // Simulate turn advance
      room.currentTurn++
      const turn2Roles = room.getRoles()
      const player1Role2 = turn2Roles[player1.id]

      expect(player1Role1).not.toBe(player1Role2)
    })
  })

  describe('card selection', () => {
    it('should track card selections', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      const player1 = room.addPlayer(ws1)
      room.addPlayer(ws2)

      const cardId = room.availableCards[0].id
      room.selectCard(player1.id, cardId)

      expect(room.cardSelections.size).toBe(1)
      expect(room.cardSelections.get(player1.id)).toBe(cardId)
    })

    it('should ignore invalid card selections', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      const player1 = room.addPlayer(ws1)
      room.addPlayer(ws2)

      room.selectCard(player1.id, 'invalid_card_id')
      expect(room.cardSelections.size).toBe(0)
    })

    it('should ignore selections outside plan phase', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      const player1 = room.addPlayer(ws1)
      room.addPlayer(ws2)

      room.currentPhase = 'resolve'
      const cardId = room.availableCards[0].id
      room.selectCard(player1.id, cardId)

      expect(room.cardSelections.size).toBe(0)
    })
  })

  describe('state serialization', () => {
    it('should return complete state object', () => {
      const ws = createMockWs()
      room.addPlayer(ws)

      const state = room.getState()

      expect(state).toHaveProperty('roomId')
      expect(state).toHaveProperty('playerCount')
      expect(state).toHaveProperty('turn')
      expect(state).toHaveProperty('phase')
      expect(state).toHaveProperty('world')
    })
  })

  describe('broadcasting', () => {
    it('should send message to all players', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      room.addPlayer(ws1)
      room.addPlayer(ws2)

      room.broadcast({ type: 'test' })

      expect(ws1.send).toHaveBeenCalled()
      expect(ws2.send).toHaveBeenCalled()
    })

    it('should exclude specified websocket', () => {
      const ws1 = createMockWs()
      const ws2 = createMockWs()

      room.addPlayer(ws1)
      room.addPlayer(ws2)

      // Clear previous calls from game start
      ws1.send.mockClear()
      ws2.send.mockClear()

      room.broadcast({ type: 'test' }, ws1)

      expect(ws1.send).not.toHaveBeenCalled()
      expect(ws2.send).toHaveBeenCalled()
    })
  })
})
