/**
 * SoccerMathComponent.js - Shell component (back bar, lifecycle, loading)
 * Follows the same pattern as FlyZoneComponent.
 */

import './soccer-math.css'
import { SoccerMathGame } from './SoccerMathGame.js'

export class SoccerMathComponent {
  constructor(container, onBack) {
    this.container = container
    this.onBack = onBack
    this.game = null
    this.elements = {}
  }

  init() {
    this.createUI()
    this.game = new SoccerMathGame(this.elements.gameContainer)
    this.game.init()
  }

  createUI() {
    this.container.innerHTML = `
      <div class="soccermath-container">
        <div class="soccermath-back-bar">
          <button class="soccermath-back-btn">\u2190 Back</button>
          <span class="soccermath-bar-title">SPORTS ARENA</span>
        </div>
        <div class="soccermath-game-container" style="flex:1;min-height:0;display:flex;flex-direction:column;"></div>
      </div>
    `

    this.elements = {
      container: this.container.querySelector('.soccermath-container'),
      gameContainer: this.container.querySelector('.soccermath-game-container'),
      backBtn: this.container.querySelector('.soccermath-back-btn'),
    }

    this.elements.backBtn.addEventListener('click', () => {
      if (this.onBack) this.onBack()
    })
  }

  destroy() {
    if (this.game) {
      this.game.destroy()
      this.game = null
    }
    this.container.innerHTML = ''
  }
}
