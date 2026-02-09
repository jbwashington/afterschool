const SUGGESTED_PROMPTS = [
  "How do drones fly?",
  "Teach me about robots",
  "How do I get better at soccer?",
  "How can kids make money?",
  "Teach me to draw",
  "What is coding?",
  "How do 3D printers work?",
  "Tell me a fun fact!",
]

const BUDDY_BOT_INTRO = `Hi there! I'm Buddy Bot, your friendly AI helper! 🤖✨

I'm here to help you learn about all kinds of cool stuff - drones, robots, soccer, art, and more!

What would you like to explore today?`

export class AIHelper {
  constructor(container, onBack) {
    this.container = container
    this.onBack = onBack
    this.messages = []
    this.isLoading = false
    this.elements = {}
  }

  init() {
    this.createUI()
    this.bindEvents()
    this.addBotMessage(BUDDY_BOT_INTRO)
  }

  createUI() {
    this.container.innerHTML = `
      <div class="ai-helper-container">
        <div class="ai-helper-header">
          <button class="ai-helper-back">← Back</button>
          <div class="ai-helper-title">
            <span class="ai-helper-icon">✨</span>
            <span>Buddy Bot</span>
          </div>
          <div class="ai-helper-status">Online</div>
        </div>

        <div class="ai-helper-messages"></div>

        <div class="ai-helper-suggestions">
          <div class="ai-helper-suggestions-label">Try asking:</div>
          <div class="ai-helper-suggestions-list">
            ${SUGGESTED_PROMPTS.map(prompt => `
              <button class="ai-helper-suggestion">${prompt}</button>
            `).join('')}
          </div>
        </div>

        <div class="ai-helper-input-area">
          <input
            type="text"
            class="ai-helper-input"
            placeholder="Ask me anything..."
            maxlength="500"
          />
          <button class="ai-helper-send">Send</button>
        </div>
      </div>
    `

    this.elements = {
      container: this.container.querySelector('.ai-helper-container'),
      messages: this.container.querySelector('.ai-helper-messages'),
      suggestions: this.container.querySelector('.ai-helper-suggestions'),
      input: this.container.querySelector('.ai-helper-input'),
      sendBtn: this.container.querySelector('.ai-helper-send'),
      backBtn: this.container.querySelector('.ai-helper-back'),
      status: this.container.querySelector('.ai-helper-status'),
    }
  }

  bindEvents() {
    this.elements.backBtn.addEventListener('click', () => this.onBack())

    this.elements.sendBtn.addEventListener('click', () => this.sendMessage())

    this.elements.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })

    // Suggestion buttons
    const suggestionBtns = this.container.querySelectorAll('.ai-helper-suggestion')
    suggestionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.elements.input.value = btn.textContent
        this.sendMessage()
      })
    })
  }

  async sendMessage() {
    const text = this.elements.input.value.trim()
    if (!text || this.isLoading) return

    this.elements.input.value = ''
    this.addUserMessage(text)
    this.hideSuggestions()

    await this.getBotResponse(text)
  }

  addUserMessage(text) {
    this.messages.push({ role: 'user', content: text })
    this.renderMessage('user', text)
  }

  addBotMessage(text) {
    this.messages.push({ role: 'assistant', content: text })
    this.renderMessage('bot', text)
  }

  renderMessage(type, text) {
    const msgEl = document.createElement('div')
    msgEl.className = `ai-message ai-message-${type}`

    const avatar = document.createElement('div')
    avatar.className = 'ai-message-avatar'
    avatar.textContent = type === 'bot' ? '🤖' : '👤'

    const content = document.createElement('div')
    content.className = 'ai-message-content'
    content.textContent = text

    msgEl.appendChild(avatar)
    msgEl.appendChild(content)
    this.elements.messages.appendChild(msgEl)

    // Scroll to bottom
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight
  }

  showLoading() {
    this.isLoading = true
    this.elements.sendBtn.disabled = true
    this.elements.status.textContent = 'Thinking...'
    this.elements.status.classList.add('thinking')

    const loadingEl = document.createElement('div')
    loadingEl.className = 'ai-message ai-message-bot ai-message-loading'
    loadingEl.innerHTML = `
      <div class="ai-message-avatar">🤖</div>
      <div class="ai-message-content">
        <span class="ai-loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </div>
    `
    this.elements.messages.appendChild(loadingEl)
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight
  }

  hideLoading() {
    this.isLoading = false
    this.elements.sendBtn.disabled = false
    this.elements.status.textContent = 'Online'
    this.elements.status.classList.remove('thinking')

    const loadingEl = this.elements.messages.querySelector('.ai-message-loading')
    if (loadingEl) {
      loadingEl.remove()
    }
  }

  hideSuggestions() {
    this.elements.suggestions.style.display = 'none'
  }

  async getBotResponse(userMessage) {
    this.showLoading()

    try {
      // Build conversation history (last 10 messages for context)
      const history = this.messages.slice(-10)

      const response = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: history,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      this.hideLoading()

      if (data.error) {
        this.addBotMessage("Oops! I'm having trouble thinking right now. Can you try asking again? 🤔")
      } else {
        this.addBotMessage(data.response)
      }
    } catch (error) {
      console.error('AI Helper error:', error)
      this.hideLoading()
      this.addBotMessage("Hmm, I can't connect right now. Make sure Ollama is running! Try again in a moment. 🔌")
    }
  }

  destroy() {
    this.container.innerHTML = ''
    this.messages = []
  }
}
