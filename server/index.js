import { WebSocketServer } from 'ws'
import { RoomManager } from './rooms/RoomManager.js'
import { MESSAGE_TYPES } from '../shared/constants.js'

const PORT = process.env.PORT || 3001

const wss = new WebSocketServer({ port: PORT })
const roomManager = new RoomManager()

console.log(`🎮 Town Builders Council server running on port ${PORT}`)

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const roomId = url.searchParams.get('room') || 'default'

  console.log(`[connection] New client connecting to room: ${roomId}`)

  const player = roomManager.addPlayer(roomId, ws)

  if (!player) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Room is full (max 2 players)',
    }))
    ws.close()
    return
  }

  // Send room joined confirmation
  ws.send(JSON.stringify({
    type: MESSAGE_TYPES.ROOM_JOINED,
    playerId: player.id,
    playerNumber: player.number,
    roomId,
    gameState: roomManager.getRoom(roomId).getState(),
  }))

  // Notify other player
  roomManager.broadcast(roomId, {
    type: MESSAGE_TYPES.PLAYER_JOINED,
    playerId: player.id,
    playerNumber: player.number,
    playerCount: roomManager.getRoom(roomId).playerCount,
  }, ws)

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      handleMessage(roomId, player, message)
    } catch (err) {
      console.error('[message] Parse error:', err)
    }
  })

  // Handle disconnect
  ws.on('close', () => {
    console.log(`[disconnect] Player ${player.id} left room ${roomId}`)
    roomManager.removePlayer(roomId, player.id)

    roomManager.broadcast(roomId, {
      type: MESSAGE_TYPES.PLAYER_LEFT,
      playerId: player.id,
      playerCount: roomManager.getRoom(roomId)?.playerCount || 0,
    })
  })
})

function handleMessage(roomId, player, message) {
  const room = roomManager.getRoom(roomId)
  if (!room) return

  switch (message.type) {
    case MESSAGE_TYPES.SELECT_CARD:
      room.selectCard(player.id, message.cardId)
      break

    case MESSAGE_TYPES.AUDIO_SIGNAL:
      // Forward audio signals to game logic
      room.handleAudioSignal(player.id, message.signal)
      break

    default:
      console.log(`[message] Unknown type: ${message.type}`)
  }
}
