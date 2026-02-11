// 3-layer parallax starfield background

export class StarField {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.layers = [
      this._createLayer(60, 0.3, 1),   // far: many small dim stars
      this._createLayer(30, 0.6, 1.5), // mid
      this._createLayer(15, 1.0, 2.5), // near: fewer bright stars
    ]
  }

  _createLayer(count, brightness, speed) {
    const stars = []
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.5 + Math.random() * 1.5,
        brightness,
        speed,
        twinkle: Math.random() * Math.PI * 2,
      })
    }
    return stars
  }

  resize(width, height) {
    const scaleX = width / this.width
    const scaleY = height / this.height
    this.width = width
    this.height = height

    for (const layer of this.layers) {
      for (const star of layer) {
        star.x *= scaleX
        star.y *= scaleY
      }
    }
  }

  update(dt) {
    for (const layer of this.layers) {
      for (const star of layer) {
        star.y += star.speed * dt * 30
        star.twinkle += dt * 2
        if (star.y > this.height) {
          star.y = -2
          star.x = Math.random() * this.width
        }
      }
    }
  }

  draw(ctx) {
    for (const layer of this.layers) {
      for (const star of layer) {
        const flicker = 0.6 + 0.4 * Math.sin(star.twinkle)
        const alpha = star.brightness * flicker
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}
