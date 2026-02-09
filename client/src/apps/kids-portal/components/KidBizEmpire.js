// Kid Biz Empire - Turn-based agent management game

const STATIONS = {
  art: { id: 'art', name: 'Art Station', icon: '🎨', cost: 50, unlocked: true },
  writing: { id: 'writing', name: 'Writing Station', icon: '📝', cost: 50, unlocked: true },
  shirts: { id: 'shirts', name: 'Shirt Station', icon: '👕', cost: 75, unlocked: false, unlockLevel: 3 },
  games: { id: 'games', name: 'Game Station', icon: '🎮', cost: 100, unlocked: false, unlockLevel: 5 },
}

const PRODUCT_TEMPLATES = {
  art: [
    { name: 'Poster', turns: 2, basePrice: 4.99 },
    { name: 'Birthday Card', turns: 1, basePrice: 2.99 },
    { name: 'Sticker Pack', turns: 1, basePrice: 1.99 },
  ],
  writing: [
    { name: 'Short Story', turns: 2, basePrice: 2.99 },
    { name: 'Fun Facts eBook', turns: 3, basePrice: 4.99 },
    { name: 'Joke Book', turns: 2, basePrice: 3.99 },
  ],
  shirts: [
    { name: 'T-Shirt Design', turns: 2, basePrice: 5.99 },
    { name: 'Hoodie Design', turns: 3, basePrice: 7.99 },
  ],
  games: [
    { name: 'Mini Puzzle', turns: 3, basePrice: 1.99 },
    { name: 'Adventure Game', turns: 5, basePrice: 4.99 },
  ],
}

export class KidBizEmpire {
  constructor(container, onBack) {
    this.container = container
    this.onBack = onBack

    // Game state
    this.turn = 1
    this.gold = 100
    this.empireLevel = 1
    this.experience = 0
    this.agents = []
    this.stations = { ...STATIONS }
    this.activeJobs = []
    this.completedProducts = []
    this.shopItems = []
    this.orders = []
    this.turnPhase = 'actions' // events, actions, production, sales

    this.elements = {}
    this.isGeneratingAgent = false
  }

  init() {
    this.createUI()
    this.bindEvents()
    this.render()
  }

  createUI() {
    this.container.innerHTML = `
      <div class="kidbiz-container">
        <div class="kidbiz-header">
          <button class="kidbiz-back-btn">← Back</button>
          <div class="kidbiz-title">🏭 KID BIZ EMPIRE</div>
          <div class="kidbiz-turn">Turn ${this.turn}</div>
        </div>

        <div class="kidbiz-stats">
          <span class="kidbiz-stat">💰 ${this.gold}</span>
          <span class="kidbiz-stat">⭐ Level ${this.empireLevel}</span>
          <span class="kidbiz-stat">📦 Products: ${this.completedProducts.length}</span>
        </div>

        <div class="kidbiz-main">
          <div class="kidbiz-map-area">
            <div class="kidbiz-map"></div>
            <div class="kidbiz-map-actions">
              <button class="kidbiz-btn kidbiz-build-btn">🔨 Build Station</button>
              <button class="kidbiz-btn kidbiz-end-turn-btn">▶ End Turn</button>
            </div>
          </div>

          <div class="kidbiz-sidebar">
            <div class="kidbiz-panel kidbiz-jobs-panel">
              <div class="kidbiz-panel-title">📋 Active Jobs</div>
              <div class="kidbiz-jobs-list"></div>
            </div>
            <div class="kidbiz-panel kidbiz-orders-panel">
              <div class="kidbiz-panel-title">📨 Orders</div>
              <div class="kidbiz-orders-list"></div>
            </div>
          </div>
        </div>

        <div class="kidbiz-squad">
          <div class="kidbiz-squad-title">🤖 YOUR SQUAD</div>
          <div class="kidbiz-squad-list"></div>
          <button class="kidbiz-btn kidbiz-hire-btn">➕ Hire Agent ($50)</button>
        </div>

        <div class="kidbiz-message-bar"></div>
      </div>
    `

    this.elements = {
      container: this.container.querySelector('.kidbiz-container'),
      backBtn: this.container.querySelector('.kidbiz-back-btn'),
      turnDisplay: this.container.querySelector('.kidbiz-turn'),
      stats: this.container.querySelector('.kidbiz-stats'),
      map: this.container.querySelector('.kidbiz-map'),
      buildBtn: this.container.querySelector('.kidbiz-build-btn'),
      endTurnBtn: this.container.querySelector('.kidbiz-end-turn-btn'),
      jobsList: this.container.querySelector('.kidbiz-jobs-list'),
      ordersList: this.container.querySelector('.kidbiz-orders-list'),
      squadList: this.container.querySelector('.kidbiz-squad-list'),
      hireBtn: this.container.querySelector('.kidbiz-hire-btn'),
      messageBar: this.container.querySelector('.kidbiz-message-bar'),
    }
  }

  bindEvents() {
    this.elements.backBtn.addEventListener('click', () => this.onBack())
    this.elements.endTurnBtn.addEventListener('click', () => this.endTurn())
    this.elements.hireBtn.addEventListener('click', () => this.hireAgent())
    this.elements.buildBtn.addEventListener('click', () => this.showBuildMenu())
  }

  render() {
    this.renderStats()
    this.renderMap()
    this.renderSquad()
    this.renderJobs()
    this.renderOrders()
  }

  renderStats() {
    this.elements.stats.innerHTML = `
      <span class="kidbiz-stat">💰 ${this.gold}</span>
      <span class="kidbiz-stat">⭐ Level ${this.empireLevel}</span>
      <span class="kidbiz-stat">📦 Products: ${this.completedProducts.length}</span>
    `
    this.elements.turnDisplay.textContent = `Turn ${this.turn}`
  }

  renderMap() {
    const stationsList = Object.values(this.stations)

    this.elements.map.innerHTML = `
      <div class="kidbiz-hex-grid">
        <div class="kidbiz-hex kidbiz-hex-hq">
          <span class="kidbiz-hex-icon">🏠</span>
          <span class="kidbiz-hex-label">HQ</span>
        </div>
        ${stationsList.map(station => `
          <div class="kidbiz-hex kidbiz-hex-station ${station.unlocked ? '' : 'locked'}"
               data-station="${station.id}">
            <span class="kidbiz-hex-icon">${station.unlocked ? station.icon : '🔒'}</span>
            <span class="kidbiz-hex-label">${station.unlocked ? station.name : `Lv.${station.unlockLevel}`}</span>
            ${this.getAgentAtStation(station.id) ? `
              <div class="kidbiz-hex-agent">🤖</div>
            ` : ''}
          </div>
        `).join('')}
        <div class="kidbiz-hex kidbiz-hex-empty" data-slot="1">
          <span class="kidbiz-hex-icon">⬡</span>
          <span class="kidbiz-hex-label">Empty</span>
        </div>
        <div class="kidbiz-hex kidbiz-hex-empty" data-slot="2">
          <span class="kidbiz-hex-icon">⬡</span>
          <span class="kidbiz-hex-label">Empty</span>
        </div>
      </div>
    `

    // Bind station clicks
    const stationHexes = this.elements.map.querySelectorAll('.kidbiz-hex-station:not(.locked)')
    stationHexes.forEach(hex => {
      hex.addEventListener('click', () => {
        const stationId = hex.dataset.station
        this.showStationMenu(stationId)
      })
    })
  }

  renderSquad() {
    if (this.agents.length === 0) {
      this.elements.squadList.innerHTML = `
        <div class="kidbiz-empty-squad">
          No agents yet! Hire your first agent to get started.
        </div>
      `
      return
    }

    this.elements.squadList.innerHTML = this.agents.map((agent, index) => `
      <div class="kidbiz-agent-card" data-index="${index}">
        <div class="kidbiz-agent-avatar">${agent.ascii_face || '🤖'}</div>
        <div class="kidbiz-agent-info">
          <div class="kidbiz-agent-name">${agent.icon} ${agent.name}</div>
          <div class="kidbiz-agent-title">${agent.nickname}</div>
          <div class="kidbiz-agent-status">
            ${agent.assignedStation ? `📍 ${this.stations[agent.assignedStation]?.name}` : '💤 Idle'}
          </div>
        </div>
        <div class="kidbiz-agent-mood">
          ${this.getMoodEmoji(agent.mood)} ${agent.moodValue}%
        </div>
      </div>
    `).join('')

    // Bind agent card clicks
    const agentCards = this.elements.squadList.querySelectorAll('.kidbiz-agent-card')
    agentCards.forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.dataset.index)
        this.showAgentMenu(index)
      })
    })
  }

  renderJobs() {
    if (this.activeJobs.length === 0) {
      this.elements.jobsList.innerHTML = `
        <div class="kidbiz-empty">No active jobs</div>
      `
      return
    }

    this.elements.jobsList.innerHTML = this.activeJobs.map(job => `
      <div class="kidbiz-job">
        <div class="kidbiz-job-name">${job.productName}</div>
        <div class="kidbiz-job-agent">🤖 ${job.agentName}</div>
        <div class="kidbiz-job-progress">
          <div class="kidbiz-progress-bar">
            <div class="kidbiz-progress-fill" style="width: ${job.progress}%"></div>
          </div>
          <span>${job.turnsLeft} turns</span>
        </div>
      </div>
    `).join('')
  }

  renderOrders() {
    if (this.orders.length === 0) {
      this.elements.ordersList.innerHTML = `
        <div class="kidbiz-empty">No orders yet</div>
      `
      return
    }

    this.elements.ordersList.innerHTML = this.orders.map((order, index) => `
      <div class="kidbiz-order">
        <div class="kidbiz-order-desc">"${order.description}"</div>
        <div class="kidbiz-order-info">
          <span>${order.type} • $${order.price}</span>
          <span>Due: ${order.dueIn} turns</span>
        </div>
        <div class="kidbiz-order-actions">
          <button class="kidbiz-btn-small" data-accept="${index}">✅</button>
          <button class="kidbiz-btn-small" data-reject="${index}">❌</button>
        </div>
      </div>
    `).join('')

    // Bind order buttons
    this.elements.ordersList.querySelectorAll('[data-accept]').forEach(btn => {
      btn.addEventListener('click', () => this.acceptOrder(parseInt(btn.dataset.accept)))
    })
    this.elements.ordersList.querySelectorAll('[data-reject]').forEach(btn => {
      btn.addEventListener('click', () => this.rejectOrder(parseInt(btn.dataset.reject)))
    })
  }

  getMoodEmoji(mood) {
    const moods = { happy: '😊', okay: '😐', sad: '😢', hyped: '🤩' }
    return moods[mood] || '😊'
  }

  getAgentAtStation(stationId) {
    return this.agents.find(a => a.assignedStation === stationId)
  }

  showMessage(text) {
    this.elements.messageBar.textContent = text
    this.elements.messageBar.classList.add('visible')
    setTimeout(() => {
      this.elements.messageBar.classList.remove('visible')
    }, 3000)
  }

  async hireAgent() {
    if (this.gold < 50) {
      this.showMessage("Not enough gold! You need $50 to hire an agent.")
      return
    }

    if (this.isGeneratingAgent) {
      this.showMessage("Already generating an agent...")
      return
    }

    this.isGeneratingAgent = true
    this.elements.hireBtn.disabled = true
    this.elements.hireBtn.textContent = '⏳ Generating...'

    const types = ['artist', 'writer', 'designer', 'gamedev']
    const randomType = types[Math.floor(Math.random() * types.length)]

    try {
      const response = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: randomType })
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()

      if (data.agent) {
        this.gold -= 50
        this.agents.push(data.agent)
        this.showMessage(`Welcome ${data.agent.name} to the team!`)
        this.render()
      }
    } catch (error) {
      console.error('Failed to generate agent:', error)
      this.showMessage("Couldn't generate agent. Is Gemma 3 running?")
    } finally {
      this.isGeneratingAgent = false
      this.elements.hireBtn.disabled = false
      this.elements.hireBtn.textContent = '➕ Hire Agent ($50)'
    }
  }

  showAgentMenu(agentIndex) {
    const agent = this.agents[agentIndex]
    if (!agent) return

    // Simple assignment menu
    const unlockedStations = Object.values(this.stations).filter(s => s.unlocked)
    const menu = document.createElement('div')
    menu.className = 'kidbiz-modal'
    menu.innerHTML = `
      <div class="kidbiz-modal-content">
        <div class="kidbiz-modal-header">
          <span>${agent.icon} ${agent.name}</span>
          <button class="kidbiz-modal-close">×</button>
        </div>
        <div class="kidbiz-modal-body">
          <p><strong>${agent.nickname}</strong></p>
          <p>${agent.personality}</p>
          <p><em>Quirk: ${agent.quirk}</em></p>
          <hr>
          <p><strong>Assign to station:</strong></p>
          <div class="kidbiz-station-options">
            ${unlockedStations.map(s => `
              <button class="kidbiz-btn" data-assign="${s.id}">${s.icon} ${s.name}</button>
            `).join('')}
            <button class="kidbiz-btn" data-assign="">💤 Unassign</button>
          </div>
        </div>
      </div>
    `

    this.container.appendChild(menu)

    menu.querySelector('.kidbiz-modal-close').addEventListener('click', () => menu.remove())
    menu.querySelectorAll('[data-assign]').forEach(btn => {
      btn.addEventListener('click', () => {
        const stationId = btn.dataset.assign
        this.assignAgent(agentIndex, stationId || null)
        menu.remove()
      })
    })
  }

  assignAgent(agentIndex, stationId) {
    const agent = this.agents[agentIndex]
    if (!agent) return

    // Remove from current station
    if (agent.assignedStation) {
      agent.assignedStation = null
    }

    if (stationId) {
      // Check if station already has an agent
      const existing = this.getAgentAtStation(stationId)
      if (existing) {
        existing.assignedStation = null
      }
      agent.assignedStation = stationId
      this.showMessage(`${agent.name} assigned to ${this.stations[stationId].name}!`)
    } else {
      this.showMessage(`${agent.name} is now idle.`)
    }

    this.render()
  }

  showStationMenu(stationId) {
    const station = this.stations[stationId]
    const agent = this.getAgentAtStation(stationId)

    if (!agent) {
      this.showMessage(`Assign an agent to ${station.name} first!`)
      return
    }

    const products = PRODUCT_TEMPLATES[stationId] || []
    const menu = document.createElement('div')
    menu.className = 'kidbiz-modal'
    menu.innerHTML = `
      <div class="kidbiz-modal-content">
        <div class="kidbiz-modal-header">
          <span>${station.icon} ${station.name}</span>
          <button class="kidbiz-modal-close">×</button>
        </div>
        <div class="kidbiz-modal-body">
          <p>🤖 ${agent.name} is ready to work!</p>
          <p><strong>Start a project:</strong></p>
          <div class="kidbiz-product-options">
            ${products.map((p, i) => `
              <button class="kidbiz-btn" data-product="${i}">
                ${p.name} (${p.turns} turns) - $${p.basePrice}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `

    this.container.appendChild(menu)

    menu.querySelector('.kidbiz-modal-close').addEventListener('click', () => menu.remove())
    menu.querySelectorAll('[data-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        const productIndex = parseInt(btn.dataset.product)
        this.startProject(stationId, agent, products[productIndex])
        menu.remove()
      })
    })
  }

  startProject(stationId, agent, product) {
    const job = {
      id: Date.now(),
      stationId,
      agentId: agent.name,
      agentName: agent.name,
      productName: product.name,
      totalTurns: product.turns,
      turnsLeft: product.turns,
      progress: 0,
      basePrice: product.basePrice,
    }

    this.activeJobs.push(job)
    this.showMessage(`${agent.name} started working on ${product.name}!`)
    this.render()
  }

  showBuildMenu() {
    this.showMessage("Building coming soon! Focus on hiring agents first.")
  }

  acceptOrder(orderIndex) {
    const order = this.orders[orderIndex]
    if (!order) return

    this.showMessage(`Order accepted: ${order.description}`)
    this.orders.splice(orderIndex, 1)
    this.render()
  }

  rejectOrder(orderIndex) {
    this.orders.splice(orderIndex, 1)
    this.showMessage("Order rejected")
    this.render()
  }

  endTurn() {
    this.turn++

    // Process production
    const completed = []
    this.activeJobs = this.activeJobs.filter(job => {
      job.turnsLeft--
      job.progress = Math.round(((job.totalTurns - job.turnsLeft) / job.totalTurns) * 100)

      if (job.turnsLeft <= 0) {
        completed.push(job)
        return false
      }
      return true
    })

    // Handle completed products
    completed.forEach(job => {
      const product = {
        name: job.productName,
        price: job.basePrice,
        quality: Math.floor(Math.random() * 3) + 3, // 3-5 stars
        soldAt: null,
      }
      this.completedProducts.push(product)
      this.shopItems.push(product)
    })

    // Random sales
    this.shopItems = this.shopItems.filter(item => {
      if (Math.random() < 0.3 && !item.soldAt) {
        this.gold += item.price
        this.experience += 10
        item.soldAt = this.turn
        this.showMessage(`Sold ${item.name} for $${item.price}!`)
        return false
      }
      return true
    })

    // Maybe generate a new order
    if (Math.random() < 0.4) {
      this.generateOrder()
    }

    // Check level up
    const levelThreshold = this.empireLevel * 100
    if (this.experience >= levelThreshold) {
      this.empireLevel++
      this.experience -= levelThreshold
      this.showMessage(`🎉 LEVEL UP! You're now level ${this.empireLevel}!`)
      this.unlockStations()
    }

    // Show turn summary
    if (completed.length > 0) {
      this.showMessage(`Turn ${this.turn}: ${completed.length} project(s) completed!`)
    }

    this.render()
  }

  generateOrder() {
    const types = ['art', 'writing']
    const type = types[Math.floor(Math.random() * types.length)]
    const descriptions = {
      art: ['a cool dinosaur poster', 'a birthday card for my friend', 'a space adventure drawing'],
      writing: ['a funny joke book', 'a story about robots', 'fun facts about animals'],
    }

    const desc = descriptions[type][Math.floor(Math.random() * descriptions[type].length)]

    this.orders.push({
      type,
      description: `I want ${desc}!`,
      price: Math.floor(Math.random() * 5) + 3,
      dueIn: Math.floor(Math.random() * 3) + 3,
    })
  }

  unlockStations() {
    Object.values(this.stations).forEach(station => {
      if (!station.unlocked && station.unlockLevel && this.empireLevel >= station.unlockLevel) {
        station.unlocked = true
        this.showMessage(`🔓 ${station.name} unlocked!`)
      }
    })
  }

  destroy() {
    this.container.innerHTML = ''
  }
}
