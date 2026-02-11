/**
 * SoccerMathGame.js - Core game: state machine, canvas field + DOM HUD
 *
 * States: TITLE → PLAYING → ANIMATING → PLAYING (or LEVEL_COMPLETE or GAME_OVER)
 *         LEVEL_COMPLETE → PLAYING (after 2.5s)
 *         GAME_OVER → TITLE (restart)
 */

import { Field } from './Field.js'
import { Animations } from './Animations.js'
import { SoundFX } from './SoundFX.js'
import { generateProblem } from './MathProblems.js'

const PROBLEMS_PER_LEVEL = 5
const MAX_LIVES = 3

export class SoccerMathGame {
  constructor(container) {
    this.container = container
    this.state = 'TITLE'
    this.score = 0
    this.level = 1
    this.lives = MAX_LIVES
    this.streak = 0
    this.bestStreak = 0
    this.problemsThisLevel = 0
    this.currentProblem = null

    this.field = null
    this.animations = null
    this.sound = new SoundFX()
    this.resizeObserver = null
    this.elements = {}
  }

  init() {
    this.createDOM()
    this.setupCanvas()
    this.showTitle()
  }

  createDOM() {
    this.container.innerHTML = `
      <div class="soccermath-game-area">
        <canvas class="soccermath-canvas"></canvas>
        <div class="soccermath-hud">
          <div class="soccermath-scoreboard"></div>
          <div class="soccermath-problem-area" style="display:none;"></div>
        </div>
        <div class="soccermath-overlay" style="display:none;"></div>
      </div>
    `

    this.elements = {
      gameArea: this.container.querySelector('.soccermath-game-area'),
      canvas: this.container.querySelector('.soccermath-canvas'),
      scoreboard: this.container.querySelector('.soccermath-scoreboard'),
      problemArea: this.container.querySelector('.soccermath-problem-area'),
      overlay: this.container.querySelector('.soccermath-overlay'),
    }
  }

  setupCanvas() {
    const canvas = this.elements.canvas
    this.field = new Field(canvas)
    this.animations = new Animations(this.field, this.elements.gameArea)

    this.resizeCanvas()
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas())
    this.resizeObserver.observe(this.elements.gameArea)
  }

  resizeCanvas() {
    const canvas = this.elements.canvas
    const area = this.elements.gameArea
    if (!area) return
    const rect = area.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    this.field.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    this.field.draw()
  }

  // --- State: Title ---
  showTitle() {
    this.state = 'TITLE'
    this.elements.problemArea.style.display = 'none'
    this.elements.scoreboard.innerHTML = ''
    this.field.reset()
    this.field.draw()

    this.elements.overlay.style.display = ''
    this.elements.overlay.innerHTML = `
      <div class="soccermath-overlay-icon">⚽</div>
      <div class="soccermath-overlay-title">SOCCER MATH</div>
      <div class="soccermath-overlay-subtitle">Score goals with math power!</div>
      <button class="soccermath-play-btn">KICK OFF</button>
    `

    this.elements.overlay.querySelector('.soccermath-play-btn')
      .addEventListener('click', () => this.startGame())
  }

  // --- State: Start Game ---
  startGame() {
    this.score = 0
    this.level = 1
    this.lives = MAX_LIVES
    this.streak = 0
    this.bestStreak = 0
    this.problemsThisLevel = 0

    this.elements.overlay.style.display = 'none'
    this.sound.play('whistle')
    this.nextProblem()
  }

  // --- State: Playing ---
  nextProblem() {
    this.state = 'PLAYING'
    this.currentProblem = generateProblem(this.level)
    this.field.reset()
    this.field.draw()
    this.renderScoreboard()
    this.renderProblem()
  }

  renderScoreboard() {
    this.elements.scoreboard.innerHTML = `
      <div class="soccermath-stat">
        <span class="soccermath-stat-label">Level</span>
        <span class="soccermath-stat-value">${this.level}</span>
      </div>
      <div class="soccermath-stat">
        <span class="soccermath-stat-label">Goals</span>
        <span class="soccermath-stat-value">${this.score}</span>
      </div>
      <div class="soccermath-stat">
        <span class="soccermath-stat-label">Streak</span>
        <span class="soccermath-stat-value soccermath-streak">${this.streak > 0 ? '🔥' + this.streak : '-'}</span>
      </div>
      <div class="soccermath-stat">
        <span class="soccermath-lives">${'❤️'.repeat(this.lives)}${'🖤'.repeat(MAX_LIVES - this.lives)}</span>
      </div>
    `
  }

  renderProblem() {
    const p = this.currentProblem
    this.elements.problemArea.style.display = ''
    this.elements.problemArea.innerHTML = `
      <div class="soccermath-visual">${this.renderVisual(p.visual)}</div>
      <div class="soccermath-question">${p.question}</div>
      <div class="soccermath-choices">
        ${p.choices.map((c, i) => `
          <button class="soccermath-choice-btn" data-index="${i}" data-value="${c}">${c}</button>
        `).join('')}
      </div>
    `

    const btns = this.elements.problemArea.querySelectorAll('.soccermath-choice-btn')
    btns.forEach(btn => {
      btn.addEventListener('click', () => this.handleAnswer(btn))
    })
  }

  renderVisual(visual) {
    switch (visual.type) {
      case 'bond':
        return this.renderBond(visual)
      case 'fraction-grid':
        return this.renderFractionGrid(visual)
      case 'equation':
        return this.renderEquation(visual)
      case 'decompose':
        return this.renderDecompose(visual)
      default:
        return ''
    }
  }

  renderBond(v) {
    const wholeClass = v.whole === null ? 'soccermath-bond-unknown' : ''
    const wholeText = v.whole === null ? '?' : v.whole
    const partAClass = v.partA === null ? 'soccermath-bond-unknown' : ''
    const partAText = v.partA === null ? '?' : v.partA
    const partBClass = v.partB === null ? 'soccermath-bond-unknown' : ''
    const partBText = v.partB === null ? '?' : v.partB

    return `
      <div class="soccermath-bond">
        <div class="soccermath-bond-whole ${wholeClass}">${wholeText}</div>
        <div class="soccermath-bond-lines"></div>
        <div class="soccermath-bond-parts">
          <div class="soccermath-bond-part ${partAClass}">${partAText}</div>
          <div class="soccermath-bond-part ${partBClass}">${partBText}</div>
        </div>
      </div>
    `
  }

  renderFractionGrid(v) {
    let html = '<div class="soccermath-fraction-grid">'
    for (let i = 0; i < v.total; i++) {
      const cls = i < v.highlighted ? 'highlighted' : ''
      const emoji = i < v.highlighted ? '🟡' : '⚽'
      html += `<span class="soccermath-fraction-ball ${cls}">${emoji}</span>`
    }
    html += '</div>'
    return html
  }

  renderEquation(v) {
    const text = v.text.replace('▢', '<span class="soccermath-equation-blank"></span>')
    return `<div class="soccermath-equation">${text}</div>`
  }

  renderDecompose(v) {
    return `
      <div class="soccermath-decompose">
        <div class="soccermath-decompose-target">${v.target}</div>
        <div class="soccermath-decompose-hint">Pick the pair that adds up!</div>
      </div>
    `
  }

  // --- Handle answer selection ---
  async handleAnswer(btn) {
    if (this.state !== 'PLAYING') return
    this.state = 'ANIMATING'

    const value = btn.dataset.value
    const correct = String(this.currentProblem.answer) === String(value)

    // Disable all buttons
    const allBtns = this.elements.problemArea.querySelectorAll('.soccermath-choice-btn')
    allBtns.forEach(b => { b.disabled = true })

    if (correct) {
      btn.classList.add('correct')
      this.score++
      this.streak++
      if (this.streak > this.bestStreak) this.bestStreak = this.streak
      this.problemsThisLevel++
      this.renderScoreboard()

      this.sound.play('kick')
      this.animations.flash('goal')
      await this.animations.kickGoal()
      this.sound.play('goal')

      // Check level complete
      if (this.problemsThisLevel >= PROBLEMS_PER_LEVEL) {
        this.showLevelComplete()
        return
      }
    } else {
      btn.classList.add('wrong')
      // Highlight correct answer
      allBtns.forEach(b => {
        if (String(b.dataset.value) === String(this.currentProblem.answer)) {
          b.classList.add('correct')
        }
      })
      this.lives--
      this.streak = 0
      this.renderScoreboard()

      this.sound.play('kick')
      this.animations.flash('save')
      await this.animations.goalieSave()
      this.sound.play('wrong')

      if (this.lives <= 0) {
        this.showGameOver()
        return
      }
    }

    // Brief pause then next problem
    await new Promise(r => setTimeout(r, 400))
    this.nextProblem()
  }

  // --- Level Complete ---
  showLevelComplete() {
    this.state = 'LEVEL_COMPLETE'
    this.sound.play('levelUp')

    this.elements.overlay.style.display = ''
    this.elements.overlay.innerHTML = `
      <div class="soccermath-level-banner">LEVEL ${this.level} COMPLETE!</div>
      <div class="soccermath-overlay-subtitle">Get ready for level ${this.level + 1}...</div>
    `
    this.elements.problemArea.style.display = 'none'

    setTimeout(() => {
      if (this.state !== 'LEVEL_COMPLETE') return
      this.level++
      this.problemsThisLevel = 0
      this.lives = MAX_LIVES // Replenish lives
      this.elements.overlay.style.display = 'none'
      this.nextProblem()
    }, 2500)
  }

  // --- Game Over ---
  showGameOver() {
    this.state = 'GAME_OVER'
    this.sound.play('gameOver')

    this.elements.problemArea.style.display = 'none'
    this.elements.overlay.style.display = ''
    this.elements.overlay.innerHTML = `
      <div class="soccermath-overlay-icon">⚽</div>
      <div class="soccermath-overlay-title">GAME OVER</div>
      <div class="soccermath-overlay-stats">
        <div class="soccermath-overlay-stat">
          <div class="soccermath-overlay-stat-value">${this.score}</div>
          <div class="soccermath-overlay-stat-label">Goals</div>
        </div>
        <div class="soccermath-overlay-stat">
          <div class="soccermath-overlay-stat-value">${this.level}</div>
          <div class="soccermath-overlay-stat-label">Level</div>
        </div>
        <div class="soccermath-overlay-stat">
          <div class="soccermath-overlay-stat-value">${this.bestStreak}</div>
          <div class="soccermath-overlay-stat-label">Best Streak</div>
        </div>
      </div>
      <button class="soccermath-play-btn">PLAY AGAIN</button>
    `

    this.elements.overlay.querySelector('.soccermath-play-btn')
      .addEventListener('click', () => this.startGame())
  }

  destroy() {
    this.state = 'DESTROYED'
    this.animations?.destroy()
    this.sound?.destroy()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    this.container.innerHTML = ''
  }
}
