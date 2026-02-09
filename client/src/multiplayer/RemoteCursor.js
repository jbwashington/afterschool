// Colors for different players
const CURSOR_COLORS = [
  '#ff6b6b',  // Red
  '#4ecdc4',  // Teal
  '#ffe66d',  // Yellow
  '#95e1d3',  // Mint
  '#f38181',  // Coral
  '#a8d8ea',  // Light blue
  '#aa96da',  // Lavender
  '#fcbad3',  // Pink
]

export class RemoteCursor {
  constructor(playerId, playerNumber, playerName) {
    this.playerId = playerId
    this.playerNumber = playerNumber
    this.playerName = playerName || `Player ${playerNumber}`
    this.element = null
    this.x = 0
    this.y = 0
    this.isClicking = false
    this.color = CURSOR_COLORS[(playerNumber - 1) % CURSOR_COLORS.length]
  }

  init() {
    this.createElement()
    document.body.appendChild(this.element)
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.className = 'xp-remote-cursor'
    this.element.dataset.playerId = this.playerId

    const pointer = document.createElement('div')
    pointer.className = 'xp-remote-cursor-pointer'
    pointer.style.borderTopColor = this.color

    const label = document.createElement('div')
    label.className = 'xp-remote-cursor-label'
    label.style.backgroundColor = this.color
    label.textContent = this.playerName

    this.element.appendChild(pointer)
    this.element.appendChild(label)
  }

  updatePosition(xPercent, yPercent) {
    // Convert percentage back to pixels
    this.x = (xPercent / 100) * window.innerWidth
    this.y = (yPercent / 100) * window.innerHeight

    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  setClicking(isClicking) {
    this.isClicking = isClicking
    if (isClicking) {
      this.element.style.transform += ' scale(0.9)'
    } else {
      this.updatePosition(
        (this.x / window.innerWidth) * 100,
        (this.y / window.innerHeight) * 100
      )
    }
  }

  setName(name) {
    this.playerName = name
    const label = this.element.querySelector('.xp-remote-cursor-label')
    if (label) {
      label.textContent = name
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
}

export class RemoteCursorManager {
  constructor() {
    this.cursors = new Map()
  }

  addCursor(playerId, playerNumber, playerName) {
    if (this.cursors.has(playerId)) {
      return this.cursors.get(playerId)
    }

    const cursor = new RemoteCursor(playerId, playerNumber, playerName)
    cursor.init()
    this.cursors.set(playerId, cursor)
    return cursor
  }

  removeCursor(playerId) {
    const cursor = this.cursors.get(playerId)
    if (cursor) {
      cursor.destroy()
      this.cursors.delete(playerId)
    }
  }

  updateCursor(playerId, x, y) {
    const cursor = this.cursors.get(playerId)
    if (cursor) {
      cursor.updatePosition(x, y)
    }
  }

  setCursorClicking(playerId, isClicking) {
    const cursor = this.cursors.get(playerId)
    if (cursor) {
      cursor.setClicking(isClicking)
    }
  }

  getCursor(playerId) {
    return this.cursors.get(playerId)
  }

  clear() {
    this.cursors.forEach(cursor => cursor.destroy())
    this.cursors.clear()
  }
}
