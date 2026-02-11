// Walkie-Talkie Scanner — simulated radio with funny conversations

import { RADIO_CHANNELS } from './RadioScripts.js'

export class WalkieTalkie {
  constructor(container, synth) {
    this.container = container
    this.synth = synth
    this.el = null
    this.currentChannel = 0
    this.scanning = false
    this.scanTimer = null
    this.typeTimer = null
    this.currentLine = 0
    this.receiving = false
  }

  init() {
    this.el = document.createElement('div')
    this.el.className = 'mz-walkie-talkie'
    this.el.innerHTML = `
      <div class="mz-radio-body">
        <div class="mz-radio-screen">
          <div class="mz-radio-header">
            <span class="mz-radio-led"></span>
            <span class="mz-radio-label">MISCHIEF SCANNER 3000</span>
          </div>
          <div class="mz-radio-freq">
            <span class="mz-freq-display">${RADIO_CHANNELS[0].frequency} MHz</span>
          </div>
          <div class="mz-radio-channel">CH ${RADIO_CHANNELS[0].id} - ${RADIO_CHANNELS[0].name}</div>
          <div class="mz-radio-transcript"></div>
        </div>
        <div class="mz-radio-controls">
          <button class="mz-radio-btn mz-tune-btn" data-dir="prev">&lt; TUNE</button>
          <button class="mz-radio-btn mz-scan-btn">SCAN</button>
          <button class="mz-radio-btn mz-tune-btn" data-dir="next">TUNE &gt;</button>
        </div>
      </div>
    `

    this.container.appendChild(this.el)

    // Tune buttons
    this.el.querySelectorAll('.mz-tune-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir
        this.stopScanning()
        if (dir === 'next') {
          this.tuneChannel((this.currentChannel + 1) % RADIO_CHANNELS.length)
        } else {
          this.tuneChannel((this.currentChannel - 1 + RADIO_CHANNELS.length) % RADIO_CHANNELS.length)
        }
      })
    })

    // Scan button
    this.el.querySelector('.mz-scan-btn').addEventListener('click', () => {
      if (this.scanning) {
        this.stopScanning()
      } else {
        this.startScanning()
      }
    })
  }

  tuneChannel(index) {
    this.clearTransmission()
    this.currentChannel = index
    const ch = RADIO_CHANNELS[index]

    // Play static between channels
    this.synth.playStaticNoise(0.3)

    // Update display
    this.el.querySelector('.mz-freq-display').textContent = `${ch.frequency} MHz`
    this.el.querySelector('.mz-radio-channel').textContent = `CH ${ch.id} - ${ch.name}`
    this.el.querySelector('.mz-radio-transcript').innerHTML = ''
    this.el.querySelector('.mz-radio-led').classList.remove('receiving')

    // Start transmission after brief static
    setTimeout(() => this.startTransmission(), 500)
  }

  startTransmission() {
    this.receiving = true
    this.currentLine = 0
    this.el.querySelector('.mz-radio-led').classList.add('receiving')
    this.typeNextLine()
  }

  typeNextLine() {
    const ch = RADIO_CHANNELS[this.currentChannel]
    if (this.currentLine >= ch.lines.length) {
      this.receiving = false
      this.el.querySelector('.mz-radio-led').classList.remove('receiving')
      return
    }

    const line = ch.lines[this.currentLine]
    const transcript = this.el.querySelector('.mz-radio-transcript')
    const lineEl = document.createElement('div')
    lineEl.className = 'mz-radio-line'

    const speakerEl = document.createElement('span')
    speakerEl.className = 'mz-radio-speaker'
    speakerEl.textContent = line.speaker + ': '
    lineEl.appendChild(speakerEl)

    const textEl = document.createElement('span')
    textEl.className = 'mz-radio-text'
    lineEl.appendChild(textEl)
    transcript.appendChild(lineEl)

    // Scroll to bottom
    transcript.scrollTop = transcript.scrollHeight

    // Typewriter effect
    let charIndex = 0
    const typeChar = () => {
      if (charIndex < line.text.length) {
        textEl.textContent += line.text[charIndex]
        charIndex++
        transcript.scrollTop = transcript.scrollHeight
        this.typeTimer = setTimeout(typeChar, 30 + Math.random() * 30)
      } else {
        // Next line after pause
        this.currentLine++
        this.typeTimer = setTimeout(() => this.typeNextLine(), 1000 + Math.random() * 500)
      }
    }
    typeChar()
  }

  clearTransmission() {
    this.receiving = false
    if (this.typeTimer) {
      clearTimeout(this.typeTimer)
      this.typeTimer = null
    }
  }

  startScanning() {
    this.scanning = true
    this.el.querySelector('.mz-scan-btn').textContent = 'STOP'
    this.el.querySelector('.mz-scan-btn').classList.add('active')
    this.scanNext()
  }

  scanNext() {
    if (!this.scanning) return
    const next = (this.currentChannel + 1) % RADIO_CHANNELS.length
    this.tuneChannel(next)

    // Move to next channel after current conversation finishes (or after a timeout)
    this.scanTimer = setTimeout(() => {
      if (this.scanning) this.scanNext()
    }, 8000 + Math.random() * 4000)
  }

  stopScanning() {
    this.scanning = false
    if (this.scanTimer) {
      clearTimeout(this.scanTimer)
      this.scanTimer = null
    }
    const scanBtn = this.el.querySelector('.mz-scan-btn')
    if (scanBtn) {
      scanBtn.textContent = 'SCAN'
      scanBtn.classList.remove('active')
    }
  }

  destroy() {
    this.stopScanning()
    this.clearTransmission()
    if (this.el) {
      this.el.remove()
      this.el = null
    }
  }
}
