// Soundboard component — grid of sound buttons synthesized via Web Audio API

const SOUND_BUTTONS = [
  { id: 'fartClassic', emoji: '💨', label: 'Fart (Classic)' },
  { id: 'fartSqueaky', emoji: '🐭', label: 'Squeaky Fart' },
  { id: 'fartLong', emoji: '💣', label: 'Mega Fart' },
  { id: 'burp', emoji: '🫧', label: 'Burp' },
  { id: 'whoopeeCushion', emoji: '🪑', label: 'Whoopee Cushion' },
  { id: 'airHorn', emoji: '📯', label: 'Air Horn' },
  { id: 'boing', emoji: '🔩', label: 'Boing!' },
  { id: 'recordScratch', emoji: '💿', label: 'Record Scratch' },
  { id: 'sadTrombone', emoji: '🎺', label: 'Sad Trombone' },
  { id: 'rimShot', emoji: '🥁', label: 'Rim Shot' },
  { id: 'evilLaugh', emoji: '😈', label: 'Evil Laugh' },
  { id: 'rubberDuck', emoji: '🦆', label: 'Rubber Duck' },
  { id: 'slideWhistleUp', emoji: '⬆️', label: 'Slide Up' },
  { id: 'slideWhistleDown', emoji: '⬇️', label: 'Slide Down' },
  { id: 'cartoonSlip', emoji: '🍌', label: 'Cartoon Slip' },
  { id: 'buzzer', emoji: '🚨', label: 'Buzzer' },
]

export class Soundboard {
  constructor(container, synth) {
    this.container = container
    this.synth = synth
    this.rapidFire = false
    this.cooldowns = new Set()
    this.el = null
  }

  init() {
    this.el = document.createElement('div')
    this.el.className = 'mz-soundboard'
    this.el.innerHTML = `
      <div class="mz-soundboard-controls">
        <button class="mz-rapid-fire-btn">RAPID FIRE: OFF</button>
      </div>
      <div class="mz-soundboard-grid">
        ${SOUND_BUTTONS.map(btn => `
          <button class="mz-sound-btn" data-sound="${btn.id}">
            <span class="mz-sound-emoji">${btn.emoji}</span>
            <span class="mz-sound-label">${btn.label}</span>
          </button>
        `).join('')}
      </div>
    `

    this.container.appendChild(this.el)

    // Rapid fire toggle
    const rfBtn = this.el.querySelector('.mz-rapid-fire-btn')
    rfBtn.addEventListener('click', () => {
      this.rapidFire = !this.rapidFire
      rfBtn.textContent = `RAPID FIRE: ${this.rapidFire ? 'ON' : 'OFF'}`
      rfBtn.classList.toggle('active', this.rapidFire)
    })

    // Sound buttons
    this.el.querySelectorAll('.mz-sound-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const soundId = btn.dataset.sound
        if (!this.rapidFire && this.cooldowns.has(soundId)) return

        this.synth.playSound(soundId)

        // Flash animation
        btn.classList.add('mz-sound-btn-active')
        setTimeout(() => btn.classList.remove('mz-sound-btn-active'), 200)

        // Cooldown (unless rapid fire)
        if (!this.rapidFire) {
          this.cooldowns.add(soundId)
          setTimeout(() => this.cooldowns.delete(soundId), 300)
        }
      })
    })
  }

  destroy() {
    if (this.el) {
      this.el.remove()
      this.el = null
    }
    this.cooldowns.clear()
  }
}
