export class UIManager {
  constructor() {
    this.elements = {
      joinModal: document.getElementById('join-modal'),
      btnNewRoom: document.getElementById('btn-new-room'),
      btnJoinRoom: document.getElementById('btn-join-room'),
      roomCodeInput: document.getElementById('room-code-input'),
      turnInfo: document.getElementById('turn-info'),
      playerRole: document.getElementById('player-role'),
      playerCount: document.getElementById('player-count'),
      cardArea: document.getElementById('card-area'),
      cardsContainer: document.getElementById('cards-container'),
      phaseInstruction: document.getElementById('phase-instruction'),
      statusMessage: document.getElementById('status-message'),
      statusText: document.getElementById('status-text'),
      statusSubtext: document.getElementById('status-subtext'),
      reflectionArea: document.getElementById('reflection-area'),
      reflectionPrompt: document.getElementById('reflection-prompt'),
    }

    this.selectedCardId = null
    this.cardsDisabled = false

    // Callbacks
    this.onCreateRoom = null
    this.onJoinRoom = null
    this.onSelectCard = null

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.elements.btnNewRoom.addEventListener('click', () => {
      if (this.onCreateRoom) this.onCreateRoom()
    })

    this.elements.btnJoinRoom.addEventListener('click', () => {
      const code = this.elements.roomCodeInput.value.trim().toUpperCase()
      if (code && this.onJoinRoom) {
        this.onJoinRoom(code)
      }
    })

    this.elements.roomCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.elements.btnJoinRoom.click()
      }
    })
  }

  hideJoinModal() {
    this.elements.joinModal.classList.add('hidden')
  }

  showJoinModal() {
    this.elements.joinModal.classList.remove('hidden')
  }

  updatePlayerInfo(playerNumber, role, playerCount) {
    this.elements.playerRole.innerHTML = role
      ? `<span class="role-${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span> (Player ${playerNumber})`
      : `Player ${playerNumber}`
    this.updatePlayerCount(playerCount)
  }

  updatePlayerCount(count) {
    this.elements.playerCount.textContent = `Players: ${count}/2`
  }

  updateTurnInfo(turn, phase, role) {
    this.elements.turnInfo.textContent = `Turn ${turn} - ${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`

    if (role) {
      this.elements.playerRole.innerHTML = `<span class="role-${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`
    }
  }

  showCards(cards, role) {
    this.selectedCardId = null
    this.cardsDisabled = false
    this.elements.cardsContainer.innerHTML = ''

    const instruction = role === 'designer'
      ? '🎨 Designer: Choose a feature to add!'
      : '🔍 Tester: Pick what to try next!'

    this.setPhaseInstruction(instruction)

    for (const card of cards) {
      const cardEl = this.createCardElement(card)
      this.elements.cardsContainer.appendChild(cardEl)
    }

    this.elements.cardArea.classList.remove('hidden')
  }

  createCardElement(card) {
    const cardEl = document.createElement('div')
    cardEl.className = 'feature-card'
    cardEl.dataset.cardId = card.id

    cardEl.innerHTML = `
      <span class="card-icon">${card.icon || '🃏'}</span>
      <div class="card-name">${card.name}</div>
      <div class="card-description">${card.description}</div>
      <div class="card-category">${card.category}</div>
    `

    cardEl.addEventListener('click', () => {
      if (this.cardsDisabled || cardEl.classList.contains('selected')) return

      // Deselect others
      this.elements.cardsContainer.querySelectorAll('.feature-card').forEach(el => {
        el.classList.remove('selected')
      })

      // Select this one
      cardEl.classList.add('selected')
      this.selectedCardId = card.id

      if (this.onSelectCard) {
        this.onSelectCard(card.id)
      }
    })

    return cardEl
  }

  markCardSelected(cardId, isMe) {
    const cardEl = this.elements.cardsContainer.querySelector(`[data-card-id="${cardId}"]`)
    if (cardEl && !isMe) {
      // Visual indicator that other player selected this
      cardEl.classList.add('animate-pulse-glow')
    }
  }

  setCardsDisabled(disabled) {
    this.cardsDisabled = disabled
    this.elements.cardsContainer.querySelectorAll('.feature-card').forEach(el => {
      if (disabled) {
        el.classList.add('disabled')
      } else {
        el.classList.remove('disabled')
      }
    })
  }

  setPhaseInstruction(text) {
    this.elements.phaseInstruction.textContent = text
  }

  hideCards() {
    this.elements.cardArea.classList.add('hidden')
  }

  showStatus(text, subtext = '') {
    this.elements.statusText.textContent = text
    this.elements.statusSubtext.textContent = subtext
    this.elements.statusMessage.classList.remove('hidden')
  }

  hideStatus() {
    this.elements.statusMessage.classList.add('hidden')
  }

  showReflection(prompt) {
    this.elements.reflectionPrompt.textContent = prompt
    this.elements.reflectionArea.classList.remove('hidden')
  }

  hideReflection() {
    this.elements.reflectionArea.classList.add('hidden')
  }
}
