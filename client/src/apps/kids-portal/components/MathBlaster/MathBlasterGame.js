// Core canvas game engine for Math Blaster
// States: TITLE → PLAYING → LEVEL_COMPLETE → GAME_OVER (+ PAUSED on blur)

import { StarField } from './StarField.js'
import { Ship } from './Ship.js'
import { Asteroid } from './Asteroid.js'
import { ParticleSystem } from './Particles.js'
import { MathProblems } from './MathProblems.js'
import { SoundFX } from './SoundFX.js'

const STATES = { TITLE: 0, PLAYING: 1, LEVEL_COMPLETE: 2, GAME_OVER: 3, PAUSED: 4 }
const PROBLEMS_PER_LEVEL = 5
const MAX_SHIELDS = 3
const BASE_ASTEROID_SPEED = 40

export class MathBlasterGame {
  constructor(canvasWrapper, hudLayer) {
    this.wrapper = canvasWrapper
    this.hudLayer = hudLayer

    // Canvas
    this.canvas = document.createElement('canvas')
    this.wrapper.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')

    // Mute button
    this.muteBtn = document.createElement('button')
    this.muteBtn.className = 'mathblaster-mute-btn'
    this.muteBtn.textContent = '\uD83D\uDD0A' // speaker icon
    this.hudLayer.appendChild(this.muteBtn)

    // Systems
    this.sfx = new SoundFX()
    this.problems = new MathProblems()
    this.particles = new ParticleSystem()
    this.starField = null
    this.ship = null
    this.asteroids = []

    // Game state
    this.state = STATES.TITLE
    this.prevState = null // for pause resume
    this.level = 1
    this.score = 0
    this.shields = MAX_SHIELDS
    this.streak = 0
    this.bestStreak = 0
    this.problemsSolved = 0
    this.currentProblem = null
    this.wrongGuessesOnProblem = 0

    // Level complete timer
    this.levelTimer = 0

    // Input
    this.keys = {}
    this.spaceJustPressed = false

    // Timing
    this.lastTime = 0
    this.animFrame = null
    this.running = false

    // Screen shake
    this.shakeTimer = 0

    this._bindEvents()
    this._resize()
  }

  _bindEvents() {
    // Keyboard
    this._onKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].includes(e.key)) {
        e.stopPropagation()
        e.preventDefault()
      }
      if (e.key === ' ' && !this.keys[' ']) {
        this.spaceJustPressed = true
      }
      this.keys[e.key] = true
    }
    this._onKeyUp = (e) => {
      this.keys[e.key] = false
    }
    this._onBlur = () => {
      this.keys = {}
      if (this.state === STATES.PLAYING) {
        this.prevState = STATES.PLAYING
        this.state = STATES.PAUSED
      }
    }
    this._onFocus = () => {
      if (this.state === STATES.PAUSED && this.prevState) {
        this.state = this.prevState
        this.prevState = null
      }
    }

    this.wrapper.addEventListener('keydown', this._onKeyDown)
    this.wrapper.addEventListener('keyup', this._onKeyUp)
    this.wrapper.addEventListener('blur', this._onBlur)
    this.wrapper.addEventListener('focus', this._onFocus)

    // Mute
    this._onMute = () => {
      const muted = this.sfx.toggleMute()
      this.muteBtn.textContent = muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'
    }
    this.muteBtn.addEventListener('click', this._onMute)

    // Resize
    this._resizeObserver = new ResizeObserver(() => this._resize())
    this._resizeObserver.observe(this.wrapper)
  }

  _resize() {
    const w = this.wrapper.clientWidth
    const h = this.wrapper.clientHeight
    if (w === 0 || h === 0) return

    this.canvas.width = w
    this.canvas.height = h

    if (this.starField) {
      this.starField.resize(w, h)
    } else {
      this.starField = new StarField(w, h)
    }
    if (this.ship) {
      this.ship.resize(w, h)
    }
  }

  init() {
    const w = this.canvas.width
    const h = this.canvas.height
    this.ship = new Ship(w, h)
    this.starField = new StarField(w, h)
    this.wrapper.focus()
    this.start()
  }

  start() {
    this.running = true
    this.lastTime = performance.now()
    this._loop()
  }

  _loop() {
    if (!this.running) return
    const now = performance.now()
    const dt = Math.min((now - this.lastTime) / 1000, 0.05) // cap at 50ms
    this.lastTime = now

    this._update(dt)
    this._draw()

    this.spaceJustPressed = false
    this.animFrame = requestAnimationFrame(() => this._loop())
  }

  _update(dt) {
    // Stars always animate
    this.starField.update(dt)
    this.particles.update(dt)

    // Screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt
    }

    switch (this.state) {
      case STATES.TITLE:
        if (this.spaceJustPressed) {
          this._startGame()
        }
        break

      case STATES.PLAYING:
        this._updatePlaying(dt)
        break

      case STATES.LEVEL_COMPLETE:
        this.levelTimer -= dt
        if (this.levelTimer <= 0) {
          this._startLevel()
        }
        break

      case STATES.GAME_OVER:
        if (this.spaceJustPressed) {
          this._startGame()
        }
        break

      case STATES.PAUSED:
        // do nothing
        break
    }
  }

  _updatePlaying(dt) {
    this.ship.update(dt, this.keys)

    // Shoot
    if (this.keys[' ']) {
      if (this.ship.shoot()) {
        this.sfx.laser()
      }
    }

    // Update asteroids
    for (const asteroid of this.asteroids) {
      asteroid.update(dt)
    }

    // Laser-asteroid collisions
    for (let li = this.ship.lasers.length - 1; li >= 0; li--) {
      const laser = this.ship.lasers[li]
      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const asteroid = this.asteroids[ai]
        if (asteroid.hitTest(laser)) {
          // Remove laser
          this.ship.lasers.splice(li, 1)
          asteroid.alive = false

          if (asteroid.isCorrect) {
            this._onCorrectHit(asteroid)
          } else {
            this._onWrongHit(asteroid)
          }
          break
        }
      }
    }

    // Remove dead asteroids
    this.asteroids = this.asteroids.filter(a => a.alive)

    // Check if asteroids fell off screen (missed)
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      if (this.asteroids[i].isOffScreen(this.canvas.height)) {
        this.asteroids.splice(i, 1)
      }
    }

    // If all asteroids gone and no correct answer hit, respawn the same problem
    if (this.asteroids.length === 0 && this.currentProblem) {
      this._spawnAsteroids()
    }
  }

  _onCorrectHit(asteroid) {
    this.streak++
    if (this.streak > this.bestStreak) this.bestStreak = this.streak

    // Score: 10 base + streak bonus
    const bonus = Math.min(this.streak - 1, 5) * 5
    this.score += 10 + bonus

    this.sfx.correct()
    this.particles.explodeCorrect(asteroid.x, asteroid.y)

    // Flash green
    this._flashViewport('mathblaster-flash-green')

    // Clear remaining asteroids (they were wrong answers)
    this.asteroids.forEach(a => { a.alive = false })
    this.asteroids = []
    this.wrongGuessesOnProblem = 0

    this.problemsSolved++
    if (this.problemsSolved >= PROBLEMS_PER_LEVEL) {
      this._completeLevel()
    } else {
      this._nextProblem()
    }
  }

  _onWrongHit(asteroid) {
    this.streak = 0
    this.wrongGuessesOnProblem++
    this.sfx.wrong()
    this.particles.explodeWrong(asteroid.x, asteroid.y)

    // Screen shake + red flash
    this.shakeTimer = 0.3
    this._flashViewport('mathblaster-flash-red')

    if (this.wrongGuessesOnProblem >= 2) {
      // Lose a shield
      this.shields--

      // Highlight correct answer before clearing
      for (const a of this.asteroids) {
        if (a.isCorrect) a.glowing = true
      }

      // After a short delay, clear and move on (or game over)
      setTimeout(() => {
        this.asteroids.forEach(a => { a.alive = false })
        this.asteroids = []
        this.wrongGuessesOnProblem = 0

        if (this.shields <= 0) {
          this._gameOver()
        } else {
          this._nextProblem()
        }
      }, 800)
    }
  }

  _startGame() {
    this.state = STATES.PLAYING
    this.level = 1
    this.score = 0
    this.shields = MAX_SHIELDS
    this.streak = 0
    this.bestStreak = 0
    this.problemsSolved = 0
    this.problems.reset()
    this.ship.reset(this.canvas.width, this.canvas.height)
    this.particles.clear()
    this.asteroids = []
    this._startLevel()
  }

  _startLevel() {
    this.state = STATES.PLAYING
    this.problemsSolved = 0
    this.wrongGuessesOnProblem = 0
    this._nextProblem()
  }

  _nextProblem() {
    this.currentProblem = this.problems.generate(this.level)
    this.wrongGuessesOnProblem = 0
    this._spawnAsteroids()
  }

  _spawnAsteroids() {
    if (!this.currentProblem) return
    const w = this.canvas.width
    const choices = this.currentProblem.choices
    const spacing = w / (choices.length + 1)
    const speed = BASE_ASTEROID_SPEED + this.level * 8

    this.asteroids = choices.map((value, i) => {
      const x = spacing * (i + 1) + (Math.random() - 0.5) * 30
      const y = -30 - Math.random() * 60
      return new Asteroid(x, y, value, value === this.currentProblem.correct, speed)
    })
  }

  _completeLevel() {
    this.state = STATES.LEVEL_COMPLETE
    this.levelTimer = 2.5
    this.level++
    // Earn a shield back (up to max)
    this.shields = Math.min(this.shields + 1, MAX_SHIELDS)
    this.sfx.levelUp()
    this.particles.celebrate(this.canvas.width)
  }

  _gameOver() {
    this.state = STATES.GAME_OVER
    this.sfx.gameOver()
  }

  _flashViewport(className) {
    const vp = this.wrapper.closest('.mathblaster-viewport')
    if (!vp) return
    vp.classList.remove('mathblaster-flash-red', 'mathblaster-flash-green', 'mathblaster-shake')
    // Force reflow
    void vp.offsetWidth
    vp.classList.add(className)
    if (className === 'mathblaster-flash-red') {
      vp.classList.add('mathblaster-shake')
    }
    setTimeout(() => {
      vp.classList.remove(className, 'mathblaster-shake')
    }, 350)
  }

  // ── Drawing ──────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    // Apply screen shake offset
    ctx.save()
    if (this.shakeTimer > 0) {
      const intensity = this.shakeTimer * 20
      ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      )
    }

    // Background
    ctx.fillStyle = '#0a0020'
    ctx.fillRect(0, 0, w, h)
    this.starField.draw(ctx)

    switch (this.state) {
      case STATES.TITLE:
        this._drawTitle(ctx, w, h)
        break
      case STATES.PLAYING:
        this._drawPlaying(ctx, w, h)
        break
      case STATES.LEVEL_COMPLETE:
        this._drawPlaying(ctx, w, h)
        this._drawLevelComplete(ctx, w, h)
        break
      case STATES.GAME_OVER:
        this._drawGameOver(ctx, w, h)
        break
      case STATES.PAUSED:
        this._drawPlaying(ctx, w, h)
        this._drawPaused(ctx, w, h)
        break
    }

    this.particles.draw(ctx)
    ctx.restore()
  }

  _drawTitle(ctx, w, h) {
    // Title text
    ctx.fillStyle = '#cc88ff'
    ctx.font = 'bold 42px "Comic Sans MS", cursive'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#7733ff'
    ctx.shadowBlur = 20
    ctx.fillText('MATH BLASTER', w / 2, h * 0.3)
    ctx.shadowBlur = 0

    // Rocket emoji
    ctx.font = '60px sans-serif'
    ctx.fillText('\uD83D\uDE80', w / 2, h * 0.48)

    // Instructions
    ctx.fillStyle = '#8866cc'
    ctx.font = '18px "Comic Sans MS", cursive'
    ctx.fillText('Arrow keys to move, SPACE to shoot', w / 2, h * 0.63)
    ctx.fillText('Blast the asteroid with the right answer!', w / 2, h * 0.69)

    // Blink prompt
    if (Math.sin(performance.now() / 400) > 0) {
      ctx.fillStyle = '#ffff00'
      ctx.font = 'bold 22px "Comic Sans MS", cursive'
      ctx.fillText('Press SPACE to start', w / 2, h * 0.82)
    }
  }

  _drawPlaying(ctx, w, h) {
    // Problem display at top
    if (this.currentProblem) {
      ctx.fillStyle = 'rgba(10, 0, 32, 0.7)'
      ctx.fillRect(0, 0, w, 48)

      ctx.fillStyle = '#ffff00'
      ctx.font = 'bold 24px "Comic Sans MS", cursive'
      ctx.textAlign = 'center'
      ctx.fillText(this.currentProblem.display, w / 2, 33)
    }

    // Ship & asteroids
    this.ship.draw(ctx)
    for (const asteroid of this.asteroids) {
      asteroid.draw(ctx)
    }

    // HUD
    this._drawHUD(ctx, w, h)
  }

  _drawHUD(ctx, w, h) {
    const pad = 12

    // Shields (left)
    ctx.fillStyle = '#cc88ff'
    ctx.font = '16px "Comic Sans MS", cursive'
    ctx.textAlign = 'left'
    const shieldText = '\uD83D\uDEE1\uFE0F'.repeat(this.shields) +
      '\u2796'.repeat(MAX_SHIELDS - this.shields)
    ctx.fillText(shieldText, pad, h - pad)

    // Score (right)
    ctx.fillStyle = '#00ff88'
    ctx.textAlign = 'right'
    ctx.fillText(`Score: ${this.score}`, w - pad, h - pad)

    // Level + streak (top corners)
    ctx.fillStyle = '#cc88ff'
    ctx.textAlign = 'left'
    ctx.font = '14px "Comic Sans MS", cursive'
    ctx.fillText(`Level ${this.level}`, pad, h - pad - 22)

    if (this.streak > 1) {
      ctx.fillStyle = '#ffaa00'
      ctx.textAlign = 'right'
      ctx.fillText(`${this.streak}x streak!`, w - pad, h - pad - 22)
    }
  }

  _drawLevelComplete(ctx, w, h) {
    ctx.fillStyle = 'rgba(10, 0, 32, 0.6)'
    ctx.fillRect(0, h * 0.3, w, h * 0.35)

    ctx.fillStyle = '#00ff88'
    ctx.font = 'bold 36px "Comic Sans MS", cursive'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 15
    ctx.fillText(`Level ${this.level - 1} Complete!`, w / 2, h * 0.43)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#cc88ff'
    ctx.font = '20px "Comic Sans MS", cursive'
    ctx.fillText('+1 Shield restored', w / 2, h * 0.53)

    ctx.fillStyle = '#ffff00'
    ctx.font = '16px "Comic Sans MS", cursive'
    ctx.fillText(`Get ready for Level ${this.level}...`, w / 2, h * 0.6)
  }

  _drawGameOver(ctx, w, h) {
    ctx.fillStyle = 'rgba(10, 0, 32, 0.8)'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 40px "Comic Sans MS", cursive'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 20
    ctx.fillText('GAME OVER', w / 2, h * 0.3)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffffff'
    ctx.font = '22px "Comic Sans MS", cursive'
    ctx.fillText(`Score: ${this.score}`, w / 2, h * 0.43)
    ctx.fillText(`Level reached: ${this.level}`, w / 2, h * 0.50)

    if (this.bestStreak > 1) {
      ctx.fillStyle = '#ffaa00'
      ctx.fillText(`Best streak: ${this.bestStreak}x`, w / 2, h * 0.57)
    }

    if (Math.sin(performance.now() / 400) > 0) {
      ctx.fillStyle = '#ffff00'
      ctx.font = 'bold 20px "Comic Sans MS", cursive'
      ctx.fillText('Press SPACE to play again', w / 2, h * 0.72)
    }
  }

  _drawPaused(ctx, w, h) {
    ctx.fillStyle = 'rgba(10, 0, 32, 0.7)'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#cc88ff'
    ctx.font = 'bold 32px "Comic Sans MS", cursive'
    ctx.textAlign = 'center'
    ctx.fillText('PAUSED', w / 2, h * 0.45)

    ctx.fillStyle = '#8866cc'
    ctx.font = '18px "Comic Sans MS", cursive'
    ctx.fillText('Click to resume', w / 2, h * 0.55)
  }

  dispose() {
    this.running = false
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame)
      this.animFrame = null
    }

    this.wrapper.removeEventListener('keydown', this._onKeyDown)
    this.wrapper.removeEventListener('keyup', this._onKeyUp)
    this.wrapper.removeEventListener('blur', this._onBlur)
    this.wrapper.removeEventListener('focus', this._onFocus)
    this.muteBtn.removeEventListener('click', this._onMute)

    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }

    this.sfx.destroy()

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
    if (this.muteBtn.parentNode) {
      this.muteBtn.parentNode.removeChild(this.muteBtn)
    }
  }
}
