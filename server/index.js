import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { RoomManager } from './rooms/RoomManager.js'
import { MESSAGE_TYPES, BEATLAB_MESSAGE_TYPES, BEATLAB_CONFIG } from '../shared/constants.js'
import { handleOllamaChat, handleGenerateAgent, handleAgentDialogue, rateLimitMiddleware } from './api/ollama.js'
import { handleClippyChat } from './api/clippy.js'

const WS_PORT = process.env.WS_PORT || 6767
const HTTP_PORT = process.env.HTTP_PORT || 6768

// Create HTTP server for API endpoints
const httpServer = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Parse URL
  const url = new URL(req.url, `http://localhost:${HTTP_PORT}`)

  // Simple request/response wrapper for compatibility
  const reqWrapper = {
    body: null,
    ip: req.socket.remoteAddress,
    connection: req.connection,
  }

  const resWrapper = {
    statusCode: 200,
    headers: {},
    setHeader: (key, value) => { resWrapper.headers[key] = value },
    status: (code) => {
      resWrapper.statusCode = code
      return resWrapper
    },
    json: (data) => {
      res.writeHead(resWrapper.statusCode, {
        'Content-Type': 'application/json',
        ...resWrapper.headers
      })
      res.end(JSON.stringify(data))
    }
  }

  // Rate limiting
  let rateLimitPassed = true
  rateLimitMiddleware(reqWrapper, resWrapper, () => { rateLimitPassed = true })
  if (!rateLimitPassed) return

  // Helper to parse JSON body
  async function parseBody() {
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }
    return JSON.parse(body)
  }

  // Route: POST /api/ollama/chat (Buddy Bot chat)
  if (url.pathname === '/api/ollama/chat' && req.method === 'POST') {
    try {
      reqWrapper.body = await parseBody()
      await handleOllamaChat(reqWrapper, resWrapper)
    } catch (error) {
      console.error('API error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // Route: POST /api/agent/generate (Gemma 3 agent personality generation)
  if (url.pathname === '/api/agent/generate' && req.method === 'POST') {
    try {
      reqWrapper.body = await parseBody()
      await handleGenerateAgent(reqWrapper, resWrapper)
    } catch (error) {
      console.error('Agent generation error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // Route: POST /api/agent/dialogue (Gemma 3 dynamic dialogue)
  if (url.pathname === '/api/agent/dialogue' && req.method === 'POST') {
    try {
      reqWrapper.body = await parseBody()
      await handleAgentDialogue(reqWrapper, resWrapper)
    } catch (error) {
      console.error('Dialogue generation error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // Route: POST /api/clippy/chat (Clippy OS Assistant)
  if (url.pathname === '/api/clippy/chat' && req.method === 'POST') {
    try {
      reqWrapper.body = await parseBody()
      await handleClippyChat(reqWrapper, resWrapper)
    } catch (error) {
      console.error('Clippy chat error:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
    return
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

httpServer.listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP API server running on port ${HTTP_PORT}`)
})

// Create WebSocket server
const wss = new WebSocketServer({ port: WS_PORT })
const roomManager = new RoomManager()

console.log(`🖥️  sixsevenOS WebSocket server running on port ${WS_PORT}`)

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${WS_PORT}`)
  const roomId = url.searchParams.get('room') || 'default'

  console.log(`[connection] New client connecting to room: ${roomId}`)

  const player = roomManager.addPlayer(roomId, ws)

  if (!player) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Room is full',
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
    playerCount: roomManager.getRoom(roomId).playerCount,
  }))

  // Notify other players
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

    // Clean up BeatLab room membership if applicable
    if (player.beatLabRoomId) {
      const beatLabRoom = roomManager.getBeatLabRoom(player.beatLabRoomId)
      if (beatLabRoom) {
        beatLabRoom.players.delete(player.beatLabPlayerId)
        beatLabRoom.broadcast({
          type: BEATLAB_MESSAGE_TYPES.PLAYER_LEFT,
          playerId: player.beatLabPlayerId,
          players: getPlayerList(beatLabRoom)
        })
        roomManager.cleanupBeatLabRoom(player.beatLabRoomId)
      }
    }

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
    // Cursor sync - relay to all other clients
    case MESSAGE_TYPES.CURSOR_MOVE:
      room.broadcast({
        type: MESSAGE_TYPES.CURSOR_MOVE,
        playerId: player.id,
        playerNumber: player.number,
        x: message.x,
        y: message.y,
      }, player.ws)
      break

    case MESSAGE_TYPES.CURSOR_DOWN:
      room.broadcast({
        type: MESSAGE_TYPES.CURSOR_DOWN,
        playerId: player.id,
        button: message.button,
      }, player.ws)
      break

    case MESSAGE_TYPES.CURSOR_UP:
      room.broadcast({
        type: MESSAGE_TYPES.CURSOR_UP,
        playerId: player.id,
        button: message.button,
      }, player.ws)
      break

    // Window events - relay to all other clients
    case MESSAGE_TYPES.WINDOW_OPEN:
      room.broadcast({
        type: MESSAGE_TYPES.WINDOW_OPEN,
        playerId: player.id,
        windowId: message.windowId,
        appId: message.appId,
        x: message.x,
        y: message.y,
      }, player.ws)
      break

    case MESSAGE_TYPES.WINDOW_CLOSE:
      room.broadcast({
        type: MESSAGE_TYPES.WINDOW_CLOSE,
        playerId: player.id,
        windowId: message.windowId,
      }, player.ws)
      break

    case MESSAGE_TYPES.WINDOW_MOVE:
      room.broadcast({
        type: MESSAGE_TYPES.WINDOW_MOVE,
        playerId: player.id,
        windowId: message.windowId,
        x: message.x,
        y: message.y,
      }, player.ws)
      break

    case MESSAGE_TYPES.WINDOW_RESIZE:
      room.broadcast({
        type: MESSAGE_TYPES.WINDOW_RESIZE,
        playerId: player.id,
        windowId: message.windowId,
        width: message.width,
        height: message.height,
      }, player.ws)
      break

    case MESSAGE_TYPES.WINDOW_FOCUS:
      room.broadcast({
        type: MESSAGE_TYPES.WINDOW_FOCUS,
        playerId: player.id,
        windowId: message.windowId,
      }, player.ws)
      break

    // File system events
    case MESSAGE_TYPES.FILE_CREATE:
    case MESSAGE_TYPES.FILE_UPDATE:
    case MESSAGE_TYPES.FILE_DELETE:
      room.broadcast({
        ...message,
        playerId: player.id,
      }, player.ws)
      break

    // ===== BeatLab Music Room Messages =====
    case BEATLAB_MESSAGE_TYPES.ROOM_LIST:
      // Send list of active BeatLab rooms
      player.ws.send(JSON.stringify({
        type: BEATLAB_MESSAGE_TYPES.ROOM_LIST,
        rooms: roomManager.getBeatLabRoomList()
      }))
      break

    case BEATLAB_MESSAGE_TYPES.CREATE_ROOM:
      handleBeatLabCreateRoom(player, message)
      break

    case BEATLAB_MESSAGE_TYPES.JOIN_ROOM:
      handleBeatLabJoinRoom(player, message)
      break

    case BEATLAB_MESSAGE_TYPES.LEAVE_ROOM:
      handleBeatLabLeaveRoom(player, message)
      break

    case BEATLAB_MESSAGE_TYPES.PATTERN_UPDATE:
      handleBeatLabPatternUpdate(player, message)
      break

    case BEATLAB_MESSAGE_TYPES.TEMPO_CHANGE:
      handleBeatLabTempoChange(player, message)
      break

    case BEATLAB_MESSAGE_TYPES.PLAY_STATE:
      handleBeatLabPlayState(player, message)
      break

    default:
      console.log(`[message] Unknown type: ${message.type}`)
  }
}

// ===== BeatLab Handler Functions =====

function handleBeatLabCreateRoom(player, message) {
  const room = roomManager.createBeatLabRoom(message.roomName || 'Untitled Room')

  // Add the creating player to the room
  const beatLabPlayer = {
    id: `beatlab_${player.id}`,
    name: `Player 1`,
    ws: player.ws
  }
  room.players.set(beatLabPlayer.id, beatLabPlayer)

  // Store reference to BeatLab room on player
  player.beatLabRoomId = room.id
  player.beatLabPlayerId = beatLabPlayer.id

  // Send room created confirmation with state
  player.ws.send(JSON.stringify({
    type: BEATLAB_MESSAGE_TYPES.ROOM_CREATED,
    roomId: room.id,
    roomName: room.jamState.roomName,
    playerId: beatLabPlayer.id,
    pattern: room.jamState.pattern,
    tempo: room.jamState.tempo,
    isPlaying: room.jamState.isPlaying,
    players: getPlayerList(room)
  }))

  console.log(`[beatlab] Player created room: ${room.id}`)
}

function handleBeatLabJoinRoom(player, message) {
  const room = roomManager.getBeatLabRoom(message.roomId)

  if (!room) {
    player.ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Room not found'
    }))
    return
  }

  if (room.playerCount >= BEATLAB_CONFIG.MAX_PLAYERS_PER_ROOM) {
    player.ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Room is full'
    }))
    return
  }

  // Add the player to the room
  const playerNumber = room.playerCount + 1
  const beatLabPlayer = {
    id: `beatlab_${player.id}`,
    name: `Player ${playerNumber}`,
    ws: player.ws
  }
  room.players.set(beatLabPlayer.id, beatLabPlayer)

  // Store reference on player
  player.beatLabRoomId = room.id
  player.beatLabPlayerId = beatLabPlayer.id

  // Send room state to joining player
  player.ws.send(JSON.stringify({
    type: BEATLAB_MESSAGE_TYPES.ROOM_JOINED,
    roomId: room.id,
    roomName: room.jamState.roomName,
    playerId: beatLabPlayer.id,
    pattern: room.jamState.pattern,
    tempo: room.jamState.tempo,
    isPlaying: room.jamState.isPlaying,
    players: getPlayerList(room)
  }))

  // Notify other players
  room.broadcast({
    type: BEATLAB_MESSAGE_TYPES.PLAYER_JOINED,
    playerId: beatLabPlayer.id,
    players: getPlayerList(room)
  }, player.ws)

  console.log(`[beatlab] Player joined room: ${room.id} (${room.playerCount} players)`)
}

function handleBeatLabLeaveRoom(player, message) {
  const room = roomManager.getBeatLabRoom(message.roomId)
  if (!room || !player.beatLabPlayerId) return

  // Remove player from room
  room.players.delete(player.beatLabPlayerId)

  // Notify remaining players
  room.broadcast({
    type: BEATLAB_MESSAGE_TYPES.PLAYER_LEFT,
    playerId: player.beatLabPlayerId,
    players: getPlayerList(room)
  })

  console.log(`[beatlab] Player left room: ${room.id} (${room.playerCount} players)`)

  // Cleanup empty room
  roomManager.cleanupBeatLabRoom(room.id)

  // Clear player's room reference
  player.beatLabRoomId = null
  player.beatLabPlayerId = null
}

function handleBeatLabPatternUpdate(player, message) {
  const room = roomManager.getBeatLabRoom(message.roomId)
  if (!room || !room.jamState) return

  // Update pattern state
  const { track, step, value } = message
  if (track >= 0 && track < BEATLAB_CONFIG.TRACKS &&
      step >= 0 && step < BEATLAB_CONFIG.STEPS) {
    room.jamState.pattern[track][step] = value

    // Broadcast to all players in room
    room.broadcast({
      type: BEATLAB_MESSAGE_TYPES.PATTERN_UPDATE,
      playerId: player.beatLabPlayerId,
      track,
      step,
      value
    }, player.ws)
  }
}

function handleBeatLabTempoChange(player, message) {
  const room = roomManager.getBeatLabRoom(message.roomId)
  if (!room || !room.jamState) return

  // Update tempo (clamp to valid range)
  room.jamState.tempo = Math.max(60, Math.min(200, message.tempo))

  // Broadcast to all players in room
  room.broadcast({
    type: BEATLAB_MESSAGE_TYPES.TEMPO_CHANGE,
    playerId: player.beatLabPlayerId,
    tempo: room.jamState.tempo
  }, player.ws)
}

function handleBeatLabPlayState(player, message) {
  const room = roomManager.getBeatLabRoom(message.roomId)
  if (!room || !room.jamState) return

  // Update play state
  room.jamState.isPlaying = message.isPlaying

  // Broadcast to all players in room
  room.broadcast({
    type: BEATLAB_MESSAGE_TYPES.PLAY_STATE,
    playerId: player.beatLabPlayerId,
    isPlaying: room.jamState.isPlaying
  }, player.ws)
}

function getPlayerList(room) {
  return Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name
  }))
}
