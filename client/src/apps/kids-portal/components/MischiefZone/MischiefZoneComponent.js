// Mischief Zone — Comedy & pranks hub with soundboard, walkie-talkie, and prank lab

import { SoundSynth } from './SoundSynth.js'
import { Soundboard } from './Soundboard.js'
import { WalkieTalkie } from './WalkieTalkie.js'
import { PrankLab } from './PrankLab.js'
import './mischief-zone.css'

const TABS = [
  { id: 'soundboard', label: 'Soundboard', icon: '🔊' },
  { id: 'walkie-talkie', label: 'Walkie-Talkie', icon: '📻' },
  { id: 'prank-lab', label: 'Prank Lab', icon: '🧪' },
]

export class MischiefZoneComponent {
  constructor(container, onBack) {
    this.container = container
    this.onBack = onBack
    this.synth = new SoundSynth()
    this.activeTab = null
    this.components = {
      soundboard: null,
      'walkie-talkie': null,
      'prank-lab': null,
    }
    this.el = null
  }

  init() {
    this.createUI()
    this.switchTab('soundboard')
  }

  createUI() {
    this.el = document.createElement('div')
    this.el.className = 'mz-container'
    this.el.innerHTML = `
      <div class="mz-header">
        <button class="mz-back-btn">&lt; Back</button>
        <span class="mz-title">MISCHIEF ZONE</span>
        <span class="mz-title-icon">😈</span>
      </div>
      <div class="mz-tabs">
        ${TABS.map(tab => `
          <button class="mz-tab" data-tab="${tab.id}">
            <span class="mz-tab-icon">${tab.icon}</span>
            <span class="mz-tab-label">${tab.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="mz-content"></div>
    `

    this.container.appendChild(this.el)

    // Back button
    this.el.querySelector('.mz-back-btn').addEventListener('click', () => {
      this.onBack()
    })

    // Tab buttons
    this.el.querySelectorAll('.mz-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab)
      })
    })
  }

  switchTab(tabId) {
    if (this.activeTab === tabId) return

    // Destroy previous component
    this.destroyActiveComponent()

    this.activeTab = tabId

    // Update tab styling
    this.el.querySelectorAll('.mz-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId)
    })

    // Clear content
    const content = this.el.querySelector('.mz-content')
    content.innerHTML = ''

    // Create new component
    switch (tabId) {
      case 'soundboard':
        this.components.soundboard = new Soundboard(content, this.synth)
        this.components.soundboard.init()
        break
      case 'walkie-talkie':
        this.components['walkie-talkie'] = new WalkieTalkie(content, this.synth)
        this.components['walkie-talkie'].init()
        break
      case 'prank-lab':
        this.components['prank-lab'] = new PrankLab(content, this.synth)
        this.components['prank-lab'].init()
        break
    }
  }

  destroyActiveComponent() {
    if (this.activeTab && this.components[this.activeTab]) {
      this.components[this.activeTab].destroy()
      this.components[this.activeTab] = null
    }
  }

  destroy() {
    this.destroyActiveComponent()
    this.synth.destroy()
    if (this.el) {
      this.el.remove()
      this.el = null
    }
  }
}
