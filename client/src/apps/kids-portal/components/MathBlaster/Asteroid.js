// Answer asteroid — falls from top carrying an answer value

export class Asteroid {
  constructor(x, y, value, isCorrect, speed) {
    this.x = x
    this.y = y
    this.value = value
    this.isCorrect = isCorrect
    this.speed = speed
    this.radius = 28
    this.alive = true
    this.rotation = Math.random() * Math.PI * 2
    this.rotSpeed = (Math.random() - 0.5) * 2

    // Rocky shape: random vertex offsets
    this.vertices = 8
    this.shape = []
    for (let i = 0; i < this.vertices; i++) {
      this.shape.push(0.7 + Math.random() * 0.3)
    }

    // Glow for correct answer (used in hint mode)
    this.glowing = false
  }

  update(dt) {
    this.y += this.speed * dt
    this.rotation += this.rotSpeed * dt
  }

  draw(ctx) {
    if (!this.alive) return

    ctx.save()
    ctx.translate(this.x, this.y)

    // Glow effect when hinted
    if (this.glowing) {
      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 20
    }

    // Rocky body
    ctx.rotate(this.rotation)
    ctx.fillStyle = this.glowing ? '#336644' : '#554433'
    ctx.strokeStyle = this.glowing ? '#00ff88' : '#887766'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < this.vertices; i++) {
      const angle = (i / this.vertices) * Math.PI * 2
      const r = this.radius * this.shape[i]
      const px = Math.cos(angle) * r
      const py = Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Reset rotation for text (keep it upright)
    ctx.rotate(-this.rotation)
    ctx.shadowBlur = 0

    // Answer text
    ctx.fillStyle = this.glowing ? '#00ff88' : '#ffffff'
    ctx.font = 'bold 18px "Comic Sans MS", cursive'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(this.value), 0, 0)

    ctx.restore()
  }

  hitTest(laser) {
    if (!this.alive) return false
    const dx = this.x - laser.x
    const dy = this.y - laser.y
    return Math.sqrt(dx * dx + dy * dy) < this.radius + 4
  }

  isOffScreen(canvasHeight) {
    return this.y > canvasHeight + this.radius
  }
}
