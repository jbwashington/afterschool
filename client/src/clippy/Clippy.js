// Clippy OS Assistant - Main Component
import { ClippyTools } from './ClippyTools.js'
import { ClippyBugTracker } from './ClippyBugTracker.js'
import './clippy.css'

// Animation states for clippy.js
const ANIMATIONS = {
  idle: 'Idle1_1',
  thinking: 'Thinking',
  talking: 'Explain',
  working: 'Searching',
  success: 'Congratulate',
  greeting: 'Wave',
  pointing: 'GestureRight',
  writing: 'Writing',
  getAttention: 'GetAttention'
}

const API_URL = 'http://localhost:6768'

export class Clippy {
  constructor(os) {
    this.os = os
    this.agent = null
    this.isFirstRun = !localStorage.getItem('clippy_seen')
    this.isVisible = false
    this.chatPanel = null
    this.messagesContainer = null
    this.inputField = null
    this.sendButton = null
    this.chatHistory = []
    this.isProcessing = false
    this.tutorialStep = 0

    // Initialize tools and bug tracker
    this.tools = new ClippyTools(os)
    this.bugTracker = new ClippyBugTracker(os.fileSystem)

    // Make bug tracker accessible from tools
    this.os.clippy = this
  }

  async init() {
    await this.loadAgent()
    this.createChatPanel()

    if (this.isFirstRun) {
      setTimeout(() => this.showTutorial(), 1500)
    }
  }

  async loadAgent() {
    return new Promise((resolve) => {
      // Check if clippy.js is loaded
      if (typeof window.clippy === 'undefined') {
        console.warn('[Clippy] clippy.js not loaded, using CSS fallback')
        this.createFallbackClippy()
        resolve()
        return
      }

      try {
        window.clippy.load('Clippy', (agent) => {
          this.agent = agent

          // Position Clippy in bottom-right corner
          const agentEl = agent._el?.[0]
          if (agentEl) {
            agentEl.style.position = 'fixed'
            agentEl.style.bottom = '60px'
            agentEl.style.right = '20px'
            agentEl.style.zIndex = '9999'
          }

          resolve()
        }, (error) => {
          console.warn('[Clippy] Failed to load agent:', error)
          this.createFallbackClippy()
          resolve()
        })
      } catch (error) {
        console.warn('[Clippy] Error loading clippy.js:', error)
        this.createFallbackClippy()
        resolve()
      }
    })
  }

  createFallbackClippy() {
    // Create a simple CSS-based Clippy character
    this.fallbackEl = document.createElement('div')
    this.fallbackEl.className = 'clippy-fallback'
    this.fallbackEl.innerHTML = `
      <div class="clippy-fallback-character">
        <div class="clippy-fallback-body">📎</div>
        <div class="clippy-fallback-eyes">👀</div>
      </div>
    `
    this.fallbackEl.style.cssText = `
      position: fixed;
      bottom: 60px;
      right: 20px;
      z-index: 9999;
      font-size: 48px;
      cursor: pointer;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
      transition: transform 0.2s;
      display: none;
    `
    this.fallbackEl.addEventListener('click', () => this.toggle())
    this.fallbackEl.addEventListener('mouseenter', () => {
      this.fallbackEl.style.transform = 'scale(1.1)'
    })
    this.fallbackEl.addEventListener('mouseleave', () => {
      this.fallbackEl.style.transform = 'scale(1)'
    })
    document.body.appendChild(this.fallbackEl)
  }

  createChatPanel() {
    this.chatPanel = document.createElement('div')
    this.chatPanel.className = 'clippy-chat-panel'
    this.chatPanel.innerHTML = `
      <div class="clippy-titlebar">
        <div class="clippy-titlebar-text">
          <span class="clippy-titlebar-icon">📎</span>
          <span>Clippy - OS Helper</span>
        </div>
        <button class="clippy-close-btn" title="Close">×</button>
      </div>
      <div class="clippy-quick-actions">
        <button class="clippy-quick-btn" data-action="open-app">Open an app</button>
        <button class="clippy-quick-btn" data-action="help">What can I do?</button>
        <button class="clippy-quick-btn" data-action="bug">Report a bug</button>
      </div>
      <div class="clippy-messages"></div>
      <div class="clippy-input-area">
        <input type="text" class="clippy-input" placeholder="Type a message..." />
        <button class="clippy-send-btn">Go</button>
      </div>
    `

    document.body.appendChild(this.chatPanel)

    // Get references
    this.messagesContainer = this.chatPanel.querySelector('.clippy-messages')
    this.inputField = this.chatPanel.querySelector('.clippy-input')
    this.sendButton = this.chatPanel.querySelector('.clippy-send-btn')

    // Bind events
    this.bindChatEvents()
  }

  bindChatEvents() {
    // Close button
    this.chatPanel.querySelector('.clippy-close-btn').addEventListener('click', () => {
      this.hide()
    })

    // Send button
    this.sendButton.addEventListener('click', () => {
      this.sendMessage()
    })

    // Enter key
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })

    // Quick action buttons
    this.chatPanel.querySelectorAll('.clippy-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action
        this.handleQuickAction(action)
      })
    })
  }

  handleQuickAction(action) {
    switch (action) {
      case 'open-app':
        this.inputField.value = 'Can you help me open an app?'
        this.sendMessage()
        break
      case 'help':
        this.inputField.value = 'What can you help me with?'
        this.sendMessage()
        break
      case 'bug':
        this.inputField.value = 'I found a bug!'
        this.sendMessage()
        break
    }
  }

  async sendMessage() {
    const message = this.inputField.value.trim()
    if (!message || this.isProcessing) return

    // Clear input
    this.inputField.value = ''

    // Add user message
    this.addMessage(message, 'user')

    // Add to history
    this.chatHistory.push({ role: 'user', content: message })

    // Show thinking state
    this.isProcessing = true
    this.sendButton.disabled = true
    this.playAnimation('thinking')
    this.showLoading()

    try {
      // Get OS state for context
      const osState = this.tools.getOsState()

      // Call API
      const response = await fetch(`${API_URL}/api/clippy/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: this.chatHistory.slice(-10),
          osState
        })
      })

      this.hideLoading()

      if (!response.ok) {
        throw new Error('API error')
      }

      const data = await response.json()

      // Handle tool calls if any
      if (data.toolCalls && data.toolCalls.length > 0) {
        this.playAnimation('working')
        await this.executeToolCalls(data.toolCalls)
      }

      // Show response
      if (data.response) {
        this.playAnimation('talking')
        this.addMessage(data.response, 'clippy')
        this.chatHistory.push({ role: 'assistant', content: data.response })
      }

      this.playAnimation('success')
      setTimeout(() => this.playAnimation('idle'), 2000)

    } catch (error) {
      console.error('[Clippy] Chat error:', error)
      this.hideLoading()
      this.addMessage("Oops! I'm having trouble connecting. Make sure Ollama is running!", 'clippy')
      this.playAnimation('idle')
    }

    this.isProcessing = false
    this.sendButton.disabled = false
    this.inputField.focus()
  }

  async executeToolCalls(toolCalls) {
    for (const toolCall of toolCalls) {
      try {
        const result = await this.tools.execute(toolCall)

        // Show action status
        if (result.action) {
          this.addToolStatus(result.action, 'working')
        }

        // Show tip
        if (result.tip) {
          this.addToolStatus(result.tip, 'tip')
        }

        // Show window list if applicable
        if (result.windows && result.windows.length > 0) {
          this.addWindowList(result.windows)
        }

        // Show bug list if applicable
        if (result.bugs && result.bugs.length > 0) {
          this.addBugList(result.bugs)
        }

      } catch (error) {
        console.error('[Clippy] Tool execution error:', error)
        this.addToolStatus(`Oops! Couldn't do that: ${error.message}`, 'error')
      }
    }
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement('div')
    messageDiv.className = `clippy-message ${sender}`

    const senderLabel = sender === 'user' ? 'You' : '📎 Clippy'

    messageDiv.innerHTML = `
      <div class="clippy-message-sender">${senderLabel}</div>
      <div class="clippy-message-bubble">${this.escapeHtml(text)}</div>
    `

    this.messagesContainer.appendChild(messageDiv)
    this.scrollToBottom()
  }

  addToolStatus(text, type = 'working') {
    const statusDiv = document.createElement('div')
    statusDiv.className = `clippy-tool-status ${type}`
    statusDiv.textContent = text
    this.messagesContainer.appendChild(statusDiv)
    this.scrollToBottom()
  }

  addWindowList(windows) {
    const listDiv = document.createElement('div')
    listDiv.className = 'clippy-window-list'
    listDiv.innerHTML = windows.map(w =>
      `<div class="clippy-window-item">${w.icon || '🪟'} ${w.title}</div>`
    ).join('')
    this.messagesContainer.appendChild(listDiv)
    this.scrollToBottom()
  }

  addBugList(bugs) {
    const listDiv = document.createElement('div')
    listDiv.className = 'clippy-window-list'
    listDiv.innerHTML = bugs.map(b =>
      `<div class="clippy-window-item">🐛 #${b.id}: ${b.title} (${b.status})</div>`
    ).join('')
    this.messagesContainer.appendChild(listDiv)
    this.scrollToBottom()
  }

  showLoading() {
    const loadingDiv = document.createElement('div')
    loadingDiv.className = 'clippy-loading'
    loadingDiv.id = 'clippy-loading'
    loadingDiv.innerHTML = `
      <span>Clippy is thinking</span>
      <div class="clippy-loading-dots">
        <div class="clippy-loading-dot"></div>
        <div class="clippy-loading-dot"></div>
        <div class="clippy-loading-dot"></div>
      </div>
    `
    this.messagesContainer.appendChild(loadingDiv)
    this.scrollToBottom()
  }

  hideLoading() {
    const loading = document.getElementById('clippy-loading')
    if (loading) {
      loading.remove()
    }
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  show() {
    this.isVisible = true
    this.chatPanel.classList.add('visible')

    if (this.agent) {
      this.agent.show()
      this.playAnimation('greeting')
      setTimeout(() => this.playAnimation('idle'), 2000)
    } else if (this.fallbackEl) {
      this.fallbackEl.style.display = 'block'
    }

    // Add welcome message if first time showing
    if (this.messagesContainer.children.length === 0) {
      this.addMessage("Hi! I'm Clippy! I'm here to help you use sixsevenOS. What would you like to do?", 'clippy')
    }

    this.inputField.focus()
  }

  hide() {
    this.isVisible = false
    this.chatPanel.classList.remove('visible')

    if (this.agent) {
      this.agent.hide()
    } else if (this.fallbackEl) {
      this.fallbackEl.style.display = 'none'
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  playAnimation(state) {
    if (this.agent && ANIMATIONS[state]) {
      try {
        this.agent.play(ANIMATIONS[state])
      } catch (e) {
        // Ignore animation errors
      }
    }
  }

  // First-run tutorial
  async showTutorial() {
    localStorage.setItem('clippy_seen', 'true')

    // Show Clippy
    if (this.agent) {
      this.agent.show()
    }

    const tutorialSteps = [
      {
        text: "Hi! I'm Clippy! I'm here to help you learn sixsevenOS!",
        animation: 'greeting'
      },
      {
        text: "Click me anytime you need help finding apps or doing cool stuff!",
        animation: 'talking'
      },
      {
        text: "See that Start button in the corner? Click it to see all your apps!",
        animation: 'pointing'
      },
      {
        text: "I'll be in the taskbar at the bottom if you need me. Have fun!",
        animation: 'success'
      }
    ]

    for (const step of tutorialSteps) {
      await this.showTutorialStep(step)
    }

    // Hide after tutorial
    if (this.agent) {
      this.agent.hide()
    }
  }

  showTutorialStep(step) {
    return new Promise((resolve) => {
      this.playAnimation(step.animation)

      // Create speech bubble
      const bubble = document.createElement('div')
      bubble.className = 'clippy-speech-bubble'
      bubble.innerHTML = `
        <p>${step.text}</p>
        <button>Got it!</button>
      `

      // Position near Clippy
      bubble.style.bottom = '180px'
      bubble.style.right = '80px'

      document.body.appendChild(bubble)

      bubble.querySelector('button').addEventListener('click', () => {
        bubble.remove()
        resolve()
      })
    })
  }

  // Create taskbar icon element
  createTaskbarIcon() {
    const icon = document.createElement('div')
    icon.className = 'clippy-taskbar-icon'
    icon.innerHTML = `
      <span class="icon">📎</span>
      <span class="tooltip">Clippy - OS Helper</span>
    `
    icon.addEventListener('click', () => this.toggle())
    return icon
  }

  destroy() {
    if (this.chatPanel) {
      this.chatPanel.remove()
    }
    if (this.agent) {
      this.agent.hide()
    }
    if (this.fallbackEl) {
      this.fallbackEl.remove()
    }
  }
}
