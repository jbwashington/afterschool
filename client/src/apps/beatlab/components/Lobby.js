/**
 * Lobby - AIM-style room browser for BeatLab multiplayer
 */
export class Lobby {
  constructor(options = {}) {
    this.onCreateRoom = options.onCreateRoom || (() => {})
    this.onJoinRoom = options.onJoinRoom || (() => {})
    this.onRefresh = options.onRefresh || (() => {})
    this.onSinglePlayer = options.onSinglePlayer || (() => {})

    this.rooms = []
    this.element = null
    this.isLoading = false
  }

  render() {
    this.element = document.createElement('div')
    this.element.className = 'beatlab-lobby'

    this.element.innerHTML = `
      <div class="beatlab-lobby-header">
        <div class="beatlab-lobby-title">
          <span class="beatlab-lobby-logo">🎵</span>
          <span>BeatLab - Music Rooms</span>
        </div>
        <div class="beatlab-lobby-subtitle">Join a room to jam with friends!</div>
      </div>

      <div class="beatlab-lobby-content">
        <div class="beatlab-room-list">
          <div class="beatlab-room-list-header">
            <span class="beatlab-room-list-title">🎧 Active Rooms</span>
            <button class="beatlab-btn-small beatlab-refresh" title="Refresh">🔄</button>
          </div>
          <div class="beatlab-room-list-body">
            ${this.renderRoomList()}
          </div>
        </div>
      </div>

      <div class="beatlab-lobby-footer">
        <button class="beatlab-btn-primary beatlab-create-room">🆕 Create Room</button>
        <button class="beatlab-btn-secondary beatlab-single-player">🎹 Solo Mode</button>
      </div>
    `

    this.bindEvents()
    return this.element
  }

  renderRoomList() {
    if (this.isLoading) {
      return `
        <div class="beatlab-room-empty">
          <span class="beatlab-loading-dots">Loading rooms...</span>
        </div>
      `
    }

    if (this.rooms.length === 0) {
      return `
        <div class="beatlab-room-empty">
          <span class="beatlab-room-empty-icon">🎸</span>
          <span>No active rooms</span>
          <span class="beatlab-room-empty-sub">Create one to start jamming!</span>
        </div>
      `
    }

    return this.rooms.map(room => `
      <div class="beatlab-room-item" data-room-id="${room.id}">
        <div class="beatlab-room-info">
          <div class="beatlab-room-name">
            <span class="beatlab-room-icon">${room.isPlaying ? '🎵' : '⏸'}</span>
            <span>${room.name}</span>
          </div>
          <div class="beatlab-room-meta">
            <span class="beatlab-room-tempo">${room.tempo} BPM</span>
            <span class="beatlab-room-divider">│</span>
            <span class="beatlab-room-status">${room.isPlaying ? 'Playing' : 'Paused'}</span>
          </div>
        </div>
        <div class="beatlab-room-players">
          <span class="beatlab-room-count">${room.playerCount}/4</span>
          <div class="beatlab-room-avatars">
            ${this.renderAvatars(room.playerCount)}
          </div>
        </div>
        <button class="beatlab-btn-join" ${room.playerCount >= 4 ? 'disabled' : ''}>
          ${room.playerCount >= 4 ? 'Full' : 'Join'}
        </button>
      </div>
    `).join('')
  }

  renderAvatars(count) {
    const avatars = []
    for (let i = 0; i < Math.min(count, 4); i++) {
      avatars.push(`<span class="beatlab-avatar" style="--avatar-index: ${i}">👤</span>`)
    }
    return avatars.join('')
  }

  bindEvents() {
    // Create room button
    this.element.querySelector('.beatlab-create-room').addEventListener('click', () => {
      this.showCreateRoomDialog()
    })

    // Single player button
    this.element.querySelector('.beatlab-single-player').addEventListener('click', () => {
      this.onSinglePlayer()
    })

    // Refresh button
    this.element.querySelector('.beatlab-refresh').addEventListener('click', () => {
      this.setLoading(true)
      this.onRefresh()
    })

    // Room list click delegation
    this.element.querySelector('.beatlab-room-list-body').addEventListener('click', (e) => {
      const joinBtn = e.target.closest('.beatlab-btn-join')
      if (joinBtn && !joinBtn.disabled) {
        const roomItem = joinBtn.closest('.beatlab-room-item')
        const roomId = roomItem.dataset.roomId
        this.onJoinRoom(roomId)
      }
    })
  }

  showCreateRoomDialog() {
    const dialog = document.createElement('div')
    dialog.className = 'beatlab-dialog-overlay'
    dialog.innerHTML = `
      <div class="beatlab-dialog">
        <div class="beatlab-dialog-header">🆕 Create Music Room</div>
        <div class="beatlab-dialog-body">
          <label class="beatlab-dialog-label">Room Name</label>
          <input type="text" class="beatlab-dialog-input" placeholder="My Awesome Beats" maxlength="24" autofocus>
        </div>
        <div class="beatlab-dialog-footer">
          <button class="beatlab-btn-secondary beatlab-dialog-cancel">Cancel</button>
          <button class="beatlab-btn-primary beatlab-dialog-create">Create</button>
        </div>
      </div>
    `

    const input = dialog.querySelector('.beatlab-dialog-input')
    const createBtn = dialog.querySelector('.beatlab-dialog-create')
    const cancelBtn = dialog.querySelector('.beatlab-dialog-cancel')

    const create = () => {
      const name = input.value.trim() || 'Untitled Room'
      dialog.remove()
      this.onCreateRoom(name)
    }

    createBtn.addEventListener('click', create)
    cancelBtn.addEventListener('click', () => dialog.remove())
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.remove()
    })
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') create()
      if (e.key === 'Escape') dialog.remove()
    })

    this.element.appendChild(dialog)
    input.focus()
  }

  setRooms(rooms) {
    this.rooms = rooms
    this.isLoading = false
    this.updateRoomList()
  }

  setLoading(loading) {
    this.isLoading = loading
    this.updateRoomList()
  }

  updateRoomList() {
    const body = this.element?.querySelector('.beatlab-room-list-body')
    if (body) {
      body.innerHTML = this.renderRoomList()
    }
  }

  destroy() {
    // Cleanup if needed
  }
}
