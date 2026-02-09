export class Desktop {
  constructor(container, windowManager) {
    this.container = container
    this.windowManager = windowManager
    this.element = null
    this.iconsContainer = null
    this.selectedIcon = null

    this.icons = [
      { id: 'my_computer', label: 'My Computer', icon: '\uD83D\uDCBB', app: 'my_computer' },
      { id: 'my_documents', label: 'My Documents', icon: '\uD83D\uDCC1', app: 'my_documents' },
      { id: 'notepad', label: 'Notepad', icon: '\uD83D\uDCDD', app: 'notepad' },
      { id: 'winamp', label: 'Winamp', icon: '🎵', app: 'winamp' },
      { id: 'kids_portal', label: 'Kids Only', icon: '🌈', app: 'kids_portal' },
      { id: 'recycle_bin', label: 'Recycle Bin', icon: '\uD83D\uDDD1\uFE0F', app: 'recycle_bin' },
    ]
  }

  init() {
    this.createDesktop()
    this.createIcons()
    this.bindEvents()
  }

  createDesktop() {
    this.element = document.createElement('div')
    this.element.className = 'xp-desktop'
    this.element.id = 'desktop'

    this.iconsContainer = document.createElement('div')
    this.iconsContainer.className = 'xp-desktop-icons'
    this.element.appendChild(this.iconsContainer)

    this.container.appendChild(this.element)
  }

  createIcons() {
    for (const iconData of this.icons) {
      const icon = this.createIcon(iconData)
      this.iconsContainer.appendChild(icon)
    }
  }

  createIcon(iconData) {
    const icon = document.createElement('div')
    icon.className = 'xp-icon'
    icon.dataset.id = iconData.id
    icon.dataset.app = iconData.app

    const iconImage = document.createElement('div')
    iconImage.className = 'xp-icon-image'
    iconImage.textContent = iconData.icon

    const label = document.createElement('span')
    label.className = 'xp-icon-label'
    label.textContent = iconData.label

    icon.appendChild(iconImage)
    icon.appendChild(label)

    return icon
  }

  bindEvents() {
    // Click on desktop to deselect
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element || e.target === this.iconsContainer) {
        this.deselectAll()
      }
    })

    // Icon click to select
    this.iconsContainer.addEventListener('click', (e) => {
      const icon = e.target.closest('.xp-icon')
      if (icon) {
        e.stopPropagation()
        this.selectIcon(icon)
      }
    })

    // Double-click to open
    this.iconsContainer.addEventListener('dblclick', (e) => {
      const icon = e.target.closest('.xp-icon')
      if (icon) {
        this.openIcon(icon)
      }
    })
  }

  selectIcon(iconElement) {
    this.deselectAll()
    iconElement.classList.add('selected')
    this.selectedIcon = iconElement
  }

  deselectAll() {
    const selected = this.iconsContainer.querySelectorAll('.xp-icon.selected')
    selected.forEach(icon => icon.classList.remove('selected'))
    this.selectedIcon = null
  }

  openIcon(iconElement) {
    const appId = iconElement.dataset.app
    if (appId && this.windowManager) {
      this.windowManager.openApp(appId)
    }
  }

  getElement() {
    return this.element
  }
}
