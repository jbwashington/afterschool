/**
 * Animations.js - Tween engine for ball kick, goalie save, and confetti
 */

export class Animations {
  constructor(field, gameArea) {
    this.field = field
    this.gameArea = gameArea
    this.tweens = []
    this.rafId = null
    this.running = false
  }

  /** Simple tween: target.property from→to over duration ms with easing */
  tween(target, property, from, to, duration, easing = easeOutCubic) {
    return new Promise(resolve => {
      this.tweens.push({
        target,
        property,
        from,
        to,
        duration,
        easing,
        startTime: null,
        resolve,
      })
      if (!this.running) this.startLoop()
    })
  }

  startLoop() {
    this.running = true
    const tick = (time) => {
      if (!this.running) return

      let allDone = true
      for (const tw of this.tweens) {
        if (!tw.startTime) tw.startTime = time
        const elapsed = time - tw.startTime
        const t = Math.min(elapsed / tw.duration, 1)
        const val = tw.from + (tw.to - tw.from) * tw.easing(t)
        tw.target[tw.property] = val

        if (t >= 1) {
          tw.target[tw.property] = tw.to
          tw.resolve()
        } else {
          allDone = false
        }
      }

      this.field.draw()

      // Remove finished tweens
      this.tweens = this.tweens.filter(tw => {
        const elapsed = tw.startTime ? (time - tw.startTime) : 0
        return elapsed / tw.duration < 1
      })

      if (this.tweens.length === 0 && allDone) {
        this.running = false
        return
      }

      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  /** Ball kicks into the goal, goalie dives wrong way */
  async kickGoal() {
    const ball = this.field.ball
    const goalie = this.field.goalie

    // Pick random side for goalie to dive (wrong way)
    const diveDir = Math.random() < 0.5 ? -0.12 : 0.12
    // Ball goes opposite side
    const ballTargetX = diveDir > 0 ? 0.38 : 0.62

    // Kick ball and dive goalie simultaneously
    await Promise.all([
      this.tween(ball, 'y', 0.85, 0.32, 500, easeOutQuad),
      this.tween(ball, 'x', 0.5, ballTargetX, 500, easeOutQuad),
      this.tween(ball, 'radius', 0.03, 0.018, 500, easeOutQuad),
      this.tween(goalie, 'diveX', 0, diveDir, 400, easeOutCubic),
    ])

    // Spawn confetti
    this.spawnConfetti()

    // Short pause then reset
    await this.delay(600)
    this.field.reset()
    this.field.draw()
  }

  /** Goalie saves the ball */
  async goalieSave() {
    const ball = this.field.ball
    const goalie = this.field.goalie

    // Ball goes toward center, goalie stays and catches
    await Promise.all([
      this.tween(ball, 'y', 0.85, 0.42, 400, easeOutQuad),
      this.tween(ball, 'x', 0.5, 0.5, 400, easeOutQuad),
      this.tween(ball, 'radius', 0.03, 0.02, 400, easeOutQuad),
    ])

    // Ball bounces back
    ball.visible = false
    this.field.draw()

    await this.delay(400)
    this.field.reset()
    this.field.draw()
  }

  /** Spawn confetti DOM elements over the game area */
  spawnConfetti() {
    if (!this.gameArea) return
    const emojis = ['🎉', '⚽', '🥅', '🌟', '🎊', '✨']
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('span')
      el.className = 'soccermath-confetti'
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
      el.style.left = `${20 + Math.random() * 60}%`
      el.style.top = `${10 + Math.random() * 30}%`
      el.style.animationDuration = `${1 + Math.random() * 0.8}s`
      this.gameArea.appendChild(el)
      el.addEventListener('animationend', () => el.remove())
    }
  }

  /** Flash overlay for feedback */
  flash(type) {
    if (!this.gameArea) return
    const el = document.createElement('div')
    el.className = `soccermath-flash ${type}`
    this.gameArea.appendChild(el)
    el.addEventListener('animationend', () => el.remove())
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  stop() {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.tweens = []
  }

  destroy() {
    this.stop()
  }
}

// --- Easing functions ---
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t)
}
