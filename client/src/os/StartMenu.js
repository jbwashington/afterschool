export class StartMenu {
  constructor(windowManager, username = 'User') {
    this.windowManager = windowManager
    this.username = username
    this.element = null
    this.isOpen = false

    this.pinnedApps = [
      { id: 'notepad', label: 'Notepad', icon: '\uD83D\uDCDD' },
      { id: 'winamp', label: 'Winamp', icon: '🎵' },
    ]

    this.rightMenuItems = [
      { id: 'my_documents', label: 'My Documents', icon: '\uD83D\uDCC1' },
      { id: 'my_pictures', label: 'My Pictures', icon: '\uD83C\uDFDE\uFE0F' },
      { id: 'my_music', label: 'My Music', icon: '\uD83C\uDFB5' },
      { id: 'my_computer', label: 'My Computer', icon: '\uD83D\uDCBB' },
    ]
  }

  init() {
    this.createElement()
    this.bindEvents()
  }

  createElement() {
    this.element = document.createElement('div')
    this.element.className = 'xp-start-menu'
    this.element.innerHTML = `
      <div class="xp-start-menu-header">
        <div class="xp-user-avatar">\uD83D\uDC64</div>
        <span class="xp-user-name">${this.username}</span>
      </div>
      <div class="xp-start-menu-content">
        <div class="xp-start-menu-left">
          ${this.pinnedApps.map(app => `
            <div class="xp-start-menu-item" data-app="${app.id}">
              <span class="xp-start-menu-item-icon">${app.icon}</span>
              <span>${app.label}</span>
            </div>
          `).join('')}
          <div class="xp-start-menu-separator"></div>
          <div class="xp-start-menu-item" data-action="all_programs">
            <span class="xp-start-menu-item-icon">\uD83D\uDCC2</span>
            <span>All Programs</span>
            <span style="margin-left: auto;">\u25B6</span>
          </div>
        </div>
        <div class="xp-start-menu-right">
          ${this.rightMenuItems.map(item => `
            <div class="xp-start-menu-item" data-app="${item.id}">
              <span class="xp-start-menu-item-icon">${item.icon}</span>
              <span>${item.label}</span>
            </div>
          `).join('')}
          <div class="xp-start-menu-separator"></div>
          <div class="xp-start-menu-item" data-action="help">
            <span class="xp-start-menu-item-icon">\u2753</span>
            <span>Help and Support</span>
          </div>
        </div>
      </div>
      <div class="xp-start-menu-footer">
        <button data-action="log_off">
          <span>\uD83D\uDEAA</span>
          Log Off
        </button>
        <button data-action="shutdown">
          <span>\u23FB</span>
          Shut Down
        </button>
      </div>
    `

    document.body.appendChild(this.element)
  }

  bindEvents() {
    // App items
    this.element.querySelectorAll('[data-app]').forEach(item => {
      item.addEventListener('click', () => {
        const appId = item.dataset.app
        if (this.windowManager) {
          this.windowManager.openApp(appId)
        }
        this.close()
      })
    })

    // Action items
    this.element.querySelectorAll('[data-action]').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action
        this.handleAction(action)
      })
    })

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.element.contains(e.target) && !e.target.closest('.xp-start-button')) {
        this.close()
      }
    })
  }

  handleAction(action) {
    switch (action) {
      case 'shutdown':
        // Fun easter egg: show BSOD or reload
        console.log('Shutting down...')
        this.close()
        break
      case 'log_off':
        console.log('Logging off...')
        this.close()
        break
      case 'all_programs':
        // Would show submenu
        console.log('All Programs')
        break
      case 'help':
        console.log('Help and Support')
        break
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    this.element.classList.add('open')
    this.isOpen = true
  }

  close() {
    this.element.classList.remove('open')
    this.isOpen = false
  }

  destroy() {
    if (this.element) {
      this.element.remove()
    }
  }
}
