import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { RoomManager } from './rooms/RoomManager.js'
import { MESSAGE_TYPES } from '../shared/constants.js'
import { handleOllamaChat, handleGenerateAgent, handleAgentDialogue, rateLimitMiddleware } from './api/ollama.js'

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

    default:
      console.log(`[message] Unknown type: ${message.type}`)
  }
}
