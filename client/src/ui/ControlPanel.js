// Control Panel for live building - kids see changes instantly!
export class ControlPanel {
  constructor(onAction, onDragStart, onDragEnd) {
    this.onAction = onAction
    this.onDragStart = onDragStart || (() => {})
    this.onDragEnd = onDragEnd || (() => {})
    this.container = null
    this.dragGhost = null
    this.currentDragItem = null
    this.currentDragCategory = null
    this.categories = {
      ground: {
        label: '🌍 Ground',
        draggable: false,
        items: [
          { id: 'grass', name: 'Grass', icon: '🌿', color: 0x7ec850 },
          { id: 'sand', name: 'Sand', icon: '🏖️', color: 0xf4d03f },
          { id: 'snow', name: 'Snow', icon: '❄️', color: 0xf0f8ff },
          { id: 'stone', name: 'Stone', icon: '🪨', color: 0x808080 },
        ]
      },
      buildings: {
        label: '🏠 Buildings',
        draggable: true,
        items: [
          { id: 'house', name: 'House', icon: '🏠', mesh: 'house' },
          { id: 'tower', name: 'Tower', icon: '🗼', mesh: 'tower' },
          { id: 'playground', name: 'Playground', icon: '🎠', mesh: 'playground' },
        ]
      },
      nature: {
        label: '🌳 Nature',
        draggable: true,
        items: [
          { id: 'tree', name: 'Tree', icon: '🌳', mesh: 'tree', color: 0x2d5a27 },
          { id: 'flowers', name: 'Flowers', icon: '🌸', mesh: 'flowers' },
          { id: 'pond', name: 'Pond', icon: '💧', mesh: 'pond' },
        ]
      },
      creatures: {
        label: '🐱 Creatures',
        draggable: true,
        items: [
          { id: 'robot_cat', name: 'Robot Cat', icon: '🐱', mesh: 'robot_cat', animation: { type: 'wander', speed: 0.5, radius: 5 } },
          { id: 'butterflies', name: 'Butterflies', icon: '🦋', mesh: 'butterfly', animation: { type: 'flutter', height: 2 } },
        ]
      },
      decorations: {
        label: '✨ Decorations',
        draggable: true,
        items: [
          { id: 'lamp', name: 'Street Lamp', icon: '💡', mesh: 'lamp' },
          { id: 'rainbow', name: 'Rainbow', icon: '🌈', mesh: 'rainbow' },
        ]
      },
      sky: {
        label: '🌈 Sky',
        draggable: false,
        items: [
          { id: 'sky_blue', name: 'Day', icon: '☀️', skyColor: 0x87ceeb },
          { id: 'sky_sunset', name: 'Sunset', icon: '🌅', skyColor: 0xffb347 },
          { id: 'sky_night', name: 'Night', icon: '🌙', skyColor: 0x1a1a2e },
          { id: 'sky_pink', name: 'Pink', icon: '💜', skyColor: 0xffb6c1 },
        ]
      },
    }
    this.build()
    this.setupDragListeners()
  }

  build() {
    this.container = document.createElement('div')
    this.container.id = 'control-panel'
    this.container.className = 'fixed left-4 top-1/2 -translate-y-1/2 bg-black/80 rounded-2xl p-4 max-h-[80vh] overflow-y-auto pointer-events-auto'
    this.container.innerHTML = `
      <h2 class="text-lg font-bold mb-2 text-center">🛠️ Build</h2>
      <p class="text-xs text-gray-400 text-center mb-4">Drag items onto the world!</p>
      <div id="panel-categories" class="space-y-4"></div>
    `

    const categoriesContainer = this.container.querySelector('#panel-categories')

    for (const [key, category] of Object.entries(this.categories)) {
      const categoryEl = document.createElement('div')
      categoryEl.className = 'panel-category'
      categoryEl.innerHTML = `
        <div class="text-sm font-medium text-gray-300 mb-2">${category.label}</div>
        <div class="grid grid-cols-3 gap-2" data-category="${key}"></div>
      `

      const itemsGrid = categoryEl.querySelector('[data-category]')

      for (const item of category.items) {
        const btn = document.createElement('button')
        btn.className = 'panel-btn flex flex-col items-center justify-center p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all hover:scale-105 active:scale-95'
        if (category.draggable) {
          btn.className += ' cursor-grab active:cursor-grabbing'
          btn.draggable = true
        }
        btn.dataset.itemId = item.id
        btn.dataset.category = key
        btn.innerHTML = `
          <span class="text-2xl">${item.icon}</span>
          <span class="text-xs mt-1 text-gray-300">${item.name}</span>
        `

        // Click for non-draggable items (ground, sky)
        if (!category.draggable) {
          btn.addEventListener('click', () => this.handleClick(key, item))
        }

        // Drag events for draggable items
        if (category.draggable) {
          btn.addEventListener('dragstart', (e) => this.handleDragStart(e, key, item))
          btn.addEventListener('dragend', (e) => this.handleDragEnd(e))
        }

        itemsGrid.appendChild(btn)
      }

      categoriesContainer.appendChild(categoryEl)
    }

    // Add clear button
    const clearBtn = document.createElement('button')
    clearBtn.className = 'w-full mt-4 p-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors'
    clearBtn.textContent = '🗑️ Clear All'
    clearBtn.addEventListener('click', () => this.onAction({ type: 'clear_all' }))
    categoriesContainer.appendChild(clearBtn)

    // Create drag ghost element
    this.dragGhost = document.createElement('div')
    this.dragGhost.id = 'drag-ghost'
    this.dragGhost.className = 'fixed pointer-events-none z-50 text-4xl hidden'
    document.body.appendChild(this.dragGhost)
  }

  setupDragListeners() {
    // Track mouse position for custom drag ghost
    document.addEventListener('dragover', (e) => {
      e.preventDefault()
      if (this.dragGhost && this.currentDragItem) {
        this.dragGhost.style.left = `${e.clientX - 20}px`
        this.dragGhost.style.top = `${e.clientY - 20}px`
      }
    })
  }

  handleDragStart(e, category, item) {
    this.currentDragItem = item
    this.currentDragCategory = category

    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({ category, item }))
    e.dataTransfer.effectAllowed = 'copy'

    // Use transparent image for native drag
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)

    // Show custom ghost
    this.dragGhost.textContent = item.icon
    this.dragGhost.classList.remove('hidden')
    this.dragGhost.style.left = `${e.clientX - 20}px`
    this.dragGhost.style.top = `${e.clientY - 20}px`

    this.onDragStart(item)
  }

  handleDragEnd(e) {
    this.dragGhost.classList.add('hidden')
    this.onDragEnd()
    this.currentDragItem = null
    this.currentDragCategory = null
  }

  handleClick(category, item) {
    if (category === 'ground') {
      this.onAction({
        type: 'change_ground',
        color: item.color,
      })
    } else if (category === 'sky') {
      this.onAction({
        type: 'change_sky',
        color: item.skyColor,
      })
    }
  }

  // Called when item is dropped on canvas with position
  spawnAtPosition(x, z) {
    if (!this.currentDragItem) return

    const item = this.currentDragItem
    this.onAction({
      type: 'spawn',
      entity: {
        type: item.id,
        mesh: item.mesh || item.id,
        position: { x, y: 0, z },
        scale: { x: 1, y: 1, z: 1 },
        color: item.color || 0xffffff,
        animation: item.animation || null,
      }
    })
  }

  getCurrentDragItem() {
    return this.currentDragItem
  }

  mount(parent) {
    parent.appendChild(this.container)
  }

  unmount() {
    this.container?.remove()
    this.dragGhost?.remove()
  }

  show() {
    this.container.classList.remove('hidden')
  }

  hide() {
    this.container.classList.add('hidden')
  }
}
