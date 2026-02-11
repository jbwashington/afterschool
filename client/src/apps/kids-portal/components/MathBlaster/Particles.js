// Particle effects for explosions and celebrations

export class ParticleSystem {
  constructor() {
    this.particles = []
  }

  // Correct answer explosion — green/yellow sparkle burst
  explodeCorrect(x, y) {
    const colors = ['#00ff88', '#ffff00', '#00ccff', '#88ff44']
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3
      const speed = 80 + Math.random() * 160
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'spark',
      })
    }
  }

  // Wrong answer — red/orange sparks (smaller burst)
  explodeWrong(x, y) {
    const colors = ['#ff4444', '#ff8800', '#ff2200']
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 40 + Math.random() * 80
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.3 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'spark',
      })
    }
  }

  // Level-up celebration — shower of confetti from top
  celebrate(canvasWidth) {
    const colors = ['#ff44ff', '#44ff44', '#ffff00', '#44ffff', '#ff8844', '#ff4488']
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 60,
        vy: 60 + Math.random() * 120,
        life: 1.5 + Math.random() * 1.0,
        maxLife: 1.5 + Math.random() * 1.0,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
      })
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt

      if (p.type === 'spark') {
        p.vx *= 0.96
        p.vy *= 0.96
      }
      if (p.type === 'confetti') {
        p.rotation += p.rotSpeed * dt
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha

      if (p.type === 'confetti') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  clear() {
    this.particles = []
  }
}
