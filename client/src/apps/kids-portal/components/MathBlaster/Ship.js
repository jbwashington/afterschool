// Player spaceship — moves left/right, shoots lasers upward

export class Ship {
  constructor(canvasWidth, canvasHeight) {
    this.width = 40
    this.height = 30
    this.x = canvasWidth / 2
    this.y = canvasHeight - 50
    this.speed = 300
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight

    // Shooting
    this.lasers = []
    this.laserSpeed = 500
    this.shootCooldown = 0
    this.shootRate = 0.25 // seconds between shots

    // Invulnerability after taking damage
    this.invulnerable = false
    this.invulnTimer = 0
    this.invulnDuration = 1.5

    // Visuals
    this.thrustPhase = 0
  }

  resize(canvasWidth, canvasHeight) {
    const ratioX = canvasWidth / this.canvasWidth
    const ratioY = canvasHeight / this.canvasHeight
    this.x *= ratioX
    this.y = canvasHeight - 50
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  update(dt, keys) {
    // Movement
    if (keys.ArrowLeft || keys.a) {
      this.x -= this.speed * dt
    }
    if (keys.ArrowRight || keys.d) {
      this.x += this.speed * dt
    }

    // Clamp to canvas
    this.x = Math.max(this.width / 2, Math.min(this.canvasWidth - this.width / 2, this.x))

    // Shoot cooldown
    this.shootCooldown = Math.max(0, this.shootCooldown - dt)

    // Invulnerability timer
    if (this.invulnerable) {
      this.invulnTimer -= dt
      if (this.invulnTimer <= 0) {
        this.invulnerable = false
      }
    }

    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].y -= this.laserSpeed * dt
      if (this.lasers[i].y < -10) {
        this.lasers.splice(i, 1)
      }
    }

    this.thrustPhase += dt * 10
  }

  shoot() {
    if (this.shootCooldown > 0) return false
    this.shootCooldown = this.shootRate
    this.lasers.push({
      x: this.x,
      y: this.y - this.height / 2,
      width: 3,
      height: 14,
    })
    return true
  }

  makeInvulnerable() {
    this.invulnerable = true
    this.invulnTimer = this.invulnDuration
  }

  draw(ctx) {
    ctx.save()

    // Flash when invulnerable
    if (this.invulnerable && Math.sin(this.invulnTimer * 15) > 0) {
      ctx.globalAlpha = 0.3
    }

    // Ship body — triangle
    ctx.fillStyle = '#00ccff'
    ctx.beginPath()
    ctx.moveTo(this.x, this.y - this.height / 2)
    ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2)
    ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2)
    ctx.closePath()
    ctx.fill()

    // Cockpit
    ctx.fillStyle = '#66eeff'
    ctx.beginPath()
    ctx.moveTo(this.x, this.y - this.height / 2 + 6)
    ctx.lineTo(this.x - 8, this.y + 4)
    ctx.lineTo(this.x + 8, this.y + 4)
    ctx.closePath()
    ctx.fill()

    // Engine glow
    const glowSize = 4 + Math.sin(this.thrustPhase) * 2
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.arc(this.x - 8, this.y + this.height / 2 + 2, glowSize, 0, Math.PI * 2)
    ctx.arc(this.x + 8, this.y + this.height / 2 + 2, glowSize, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Draw lasers
    ctx.fillStyle = '#00ff88'
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 6
    for (const laser of this.lasers) {
      ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height)
    }
    ctx.shadowBlur = 0
  }

  reset(canvasWidth, canvasHeight) {
    this.x = canvasWidth / 2
    this.y = canvasHeight - 50
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.lasers = []
    this.shootCooldown = 0
    this.invulnerable = false
    this.invulnTimer = 0
  }
}
