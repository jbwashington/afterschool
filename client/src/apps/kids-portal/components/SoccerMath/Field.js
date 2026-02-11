/**
 * Field.js - Canvas renderer for the soccer field
 *
 * Draws: sky gradient, grass with stripes, goal frame + net, goalie, ball.
 * All coordinates are relative so it scales with canvas size.
 */

export class Field {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    // Ball and goalie state (mutated by Animations)
    this.ball = { x: 0.5, y: 0.85, radius: 0.03, visible: true }
    this.goalie = { x: 0.5, y: 0.38, width: 0.07, diveX: 0 }
  }

  get w() { return this.canvas.width }
  get h() { return this.canvas.height }

  /** Convert relative coords to pixel */
  px(rx) { return rx * this.w }
  py(ry) { return ry * this.h }

  reset() {
    this.ball.x = 0.5
    this.ball.y = 0.85
    this.ball.visible = true
    this.goalie.x = 0.5
    this.goalie.diveX = 0
  }

  draw() {
    const { ctx } = this
    ctx.clearRect(0, 0, this.w, this.h)

    this.drawSky()
    this.drawGrass()
    this.drawGoal()
    this.drawGoalie()
    if (this.ball.visible) this.drawBall()
  }

  drawSky() {
    const { ctx } = this
    const grad = ctx.createLinearGradient(0, 0, 0, this.py(0.35))
    grad.addColorStop(0, '#4a90d9')
    grad.addColorStop(1, '#87ceeb')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.w, this.py(0.35))
  }

  drawGrass() {
    const { ctx } = this
    const top = this.py(0.35)
    const grassH = this.h - top

    // Base grass
    const grad = ctx.createLinearGradient(0, top, 0, this.h)
    grad.addColorStop(0, '#2d8a3e')
    grad.addColorStop(1, '#1a5c28')
    ctx.fillStyle = grad
    ctx.fillRect(0, top, this.w, grassH)

    // Mow stripes
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    const stripeW = this.w / 8
    for (let i = 0; i < 8; i += 2) {
      ctx.fillRect(i * stripeW, top, stripeW, grassH)
    }

    // Center circle (faint)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(this.px(0.5), this.py(0.7), this.px(0.12), 0, Math.PI * 2)
    ctx.stroke()

    // Penalty spot
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(this.px(0.5), this.py(0.82), 3, 0, Math.PI * 2)
    ctx.fill()
  }

  drawGoal() {
    const { ctx } = this
    const goalLeft = this.px(0.28)
    const goalRight = this.px(0.72)
    const goalTop = this.py(0.22)
    const goalBottom = this.py(0.42)
    const goalW = goalRight - goalLeft
    const goalH = goalBottom - goalTop

    // Net (mesh lines)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    const cellSize = 12
    for (let x = goalLeft; x <= goalRight; x += cellSize) {
      ctx.beginPath()
      ctx.moveTo(x, goalTop)
      ctx.lineTo(x, goalBottom)
      ctx.stroke()
    }
    for (let y = goalTop; y <= goalBottom; y += cellSize) {
      ctx.beginPath()
      ctx.moveTo(goalLeft, y)
      ctx.lineTo(goalRight, y)
      ctx.stroke()
    }

    // Net background
    ctx.fillStyle = 'rgba(200,200,200,0.1)'
    ctx.fillRect(goalLeft, goalTop, goalW, goalH)

    // Goal frame (white posts)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(goalLeft, goalBottom)
    ctx.lineTo(goalLeft, goalTop)
    ctx.lineTo(goalRight, goalTop)
    ctx.lineTo(goalRight, goalBottom)
    ctx.stroke()

    // Crossbar shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(goalLeft, goalTop + 5)
    ctx.lineTo(goalRight, goalTop + 5)
    ctx.stroke()
  }

  drawGoalie() {
    const { ctx } = this
    const gx = this.px(this.goalie.x + this.goalie.diveX)
    const gy = this.py(this.goalie.y)
    const bodyW = this.px(this.goalie.width)
    const bodyH = bodyW * 1.4

    // Body (yellow jersey)
    ctx.fillStyle = '#ffdd00'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    const bx = gx - bodyW / 2
    const by = gy - bodyH / 3
    ctx.beginPath()
    ctx.roundRect(bx, by, bodyW, bodyH, 4)
    ctx.fill()
    ctx.stroke()

    // Shorts
    ctx.fillStyle = '#222'
    ctx.fillRect(bx + 4, by + bodyH - 6, bodyW - 8, 10)

    // Head
    const headR = bodyW * 0.35
    ctx.fillStyle = '#f5c69a'
    ctx.beginPath()
    ctx.arc(gx, by - headR + 2, headR, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Gloves
    ctx.fillStyle = '#44cc44'
    const gloveR = bodyW * 0.18
    // left hand
    ctx.beginPath()
    ctx.arc(bx - gloveR * 0.5 + this.px(this.goalie.diveX * 0.3), by + bodyH * 0.3, gloveR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // right hand
    ctx.beginPath()
    ctx.arc(bx + bodyW + gloveR * 0.5 + this.px(this.goalie.diveX * 0.3), by + bodyH * 0.3, gloveR, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  drawBall() {
    const { ctx } = this
    const bx = this.px(this.ball.x)
    const by = this.py(this.ball.y)
    const r = this.px(this.ball.radius)

    // Ball shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(bx, this.py(0.86), r * 1.1, r * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Ball
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(bx, by, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Pentagon pattern (simplified)
    ctx.fillStyle = '#333'
    const angles = [0, 72, 144, 216, 288]
    for (const deg of angles) {
      const rad = (deg * Math.PI) / 180
      const px = bx + Math.cos(rad) * r * 0.5
      const py = by + Math.sin(rad) * r * 0.5
      ctx.beginPath()
      ctx.arc(px, py, r * 0.18, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
