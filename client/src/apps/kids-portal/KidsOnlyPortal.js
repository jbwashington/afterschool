import { BaseApp } from '../BaseApp.js'
import { ZONES, getZoneById } from './zones/ZoneConfig.js'
import { AIHelper } from './components/AIHelper.js'
import { KidBizEmpire } from './components/KidBizEmpire.js'

export class KidsOnlyPortal extends BaseApp {
  constructor(window, windowManager) {
    super(window, windowManager)
    this.currentView = 'home'
    this.currentZone = null
    this.aiHelper = null
    this.kidBizEmpire = null
    this.elements = {}
  }

  init() {
    super.init()

    // Add custom window class
    this.window.element.classList.add('kids-portal-window')

    this.createUI()
    this.bindEvents()
    this.showHome()
  }

  createUI() {
    const container = document.createElement('div')
    container.className = 'kids-portal-container'
    container.innerHTML = `
      <div class="kids-portal-header">
        <span class="kids-portal-title">KIDS ONLY</span>
        <button class="kids-portal-close-btn">×</button>
      </div>

      <div class="kids-portal-main"></div>

      <div class="kids-portal-footer">
        <span class="kids-portal-keyword">Keyword:</span>
        <input type="text" class="kids-portal-keyword-input" value="Kids Only" readonly />
        <button class="kids-portal-keyword-btn">GO</button>
      </div>
    `

    this.window.setContent(container)

    this.elements = {
      container,
      main: container.querySelector('.kids-portal-main'),
      closeBtn: container.querySelector('.kids-portal-close-btn'),
      keywordInput: container.querySelector('.kids-portal-keyword-input'),
      keywordBtn: container.querySelector('.kids-portal-keyword-btn'),
    }
  }

  bindEvents() {
    // Close button
    this.elements.closeBtn.addEventListener('click', () => {
      this.windowManager.closeWindow(this.window.id)
    })

    // Keyword button (just for fun - returns to home)
    this.elements.keywordBtn.addEventListener('click', () => {
      this.showHome()
    })
  }

  showHome() {
    this.currentView = 'home'
    this.currentZone = null
    this.elements.keywordInput.value = 'Kids Only'

    // Clean up components if they exist
    if (this.aiHelper) {
      this.aiHelper.destroy()
      this.aiHelper = null
    }
    if (this.kidBizEmpire) {
      this.kidBizEmpire.destroy()
      this.kidBizEmpire = null
    }

    this.elements.main.innerHTML = `
      <div class="kids-portal-zones">
        ${ZONES.map(zone => `
          <button class="kids-portal-zone-btn" data-zone="${zone.id}">
            <span class="kids-portal-zone-icon">${zone.icon}</span>
            <span class="kids-portal-zone-name">${zone.name}</span>
          </button>
        `).join('')}
      </div>
    `

    // Bind zone button clicks
    const zoneButtons = this.elements.main.querySelectorAll('.kids-portal-zone-btn')
    zoneButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const zoneId = btn.dataset.zone
        this.navigateToZone(zoneId)
      })
    })
  }

  navigateToZone(zoneId) {
    const zone = getZoneById(zoneId)
    if (!zone) return

    this.currentZone = zone
    this.currentView = 'zone'
    this.elements.keywordInput.value = zone.name

    // If it's the AI Helper zone, show the chat interface
    if (zone.isAIHelper) {
      this.showAIHelper()
      return
    }

    // If it's the Kid Biz Empire zone, show the game
    if (zone.isKidBizEmpire) {
      this.showKidBizEmpire()
      return
    }

    this.elements.main.innerHTML = `
      <div class="kids-portal-zone-view">
        <div class="kids-portal-zone-header">
          <button class="kids-portal-back-btn">← Back</button>
          <span class="kids-portal-zone-icon-large">${zone.icon}</span>
          <span class="kids-portal-zone-title">${zone.name}</span>
        </div>

        <p class="kids-portal-zone-desc">${zone.description}</p>

        <div class="kids-portal-categories">
          ${zone.categories.map(cat => `
            <button class="kids-portal-category-btn" data-category="${cat.id}">
              <span class="kids-portal-category-icon">${cat.icon}</span>
              <span class="kids-portal-category-label">${cat.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `

    // Bind back button
    const backBtn = this.elements.main.querySelector('.kids-portal-back-btn')
    backBtn.addEventListener('click', () => this.showHome())

    // Bind category buttons (placeholder for now)
    const categoryBtns = this.elements.main.querySelectorAll('.kids-portal-category-btn')
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const categoryId = btn.dataset.category
        console.log(`Category clicked: ${categoryId}`)
        // TODO: Navigate to category content
      })
    })
  }

  showAIHelper() {
    this.elements.main.innerHTML = ''
    this.aiHelper = new AIHelper(this.elements.main, () => this.showHome())
    this.aiHelper.init()
  }

  showKidBizEmpire() {
    this.elements.main.innerHTML = ''
    this.kidBizEmpire = new KidBizEmpire(this.elements.main, () => this.showHome())
    this.kidBizEmpire.init()
  }

  onFocus() {
    // Could add sound effect or animation here
  }

  onBlur() {
    // Could pause animations here
  }

  destroy() {
    if (this.aiHelper) {
      this.aiHelper.destroy()
      this.aiHelper = null
    }
    if (this.kidBizEmpire) {
      this.kidBizEmpire.destroy()
      this.kidBizEmpire = null
    }
    super.destroy()
  }
}

// App definition for registry
export const KidsOnlyPortalApp = {
  id: 'kids_portal',
  title: 'Kids Only',
  icon: '🌈',
  defaultWidth: 800,
  defaultHeight: 600,
  minWidth: 640,
  minHeight: 480,
  resizable: true,
  menuItems: [],
  create: (window, windowManager) => {
    const app = new KidsOnlyPortal(window, windowManager)
    app.init()
    return app
  }
}
