export class RingSystem {
  constructor(THREE) {
    this.THREE = THREE
    this.rings = []
    this.score = 0
    this.totalRings = 6
    this.passedCount = 0
    this.onRingPass = null // callback(ringIndex, score)
    this.onAllPassed = null // callback(totalScore)
    this.celebrationDone = false

    // Load persisted score
    try {
      this.score = parseInt(localStorage.getItem('flyzone-score') || '0', 10)
    } catch { /* ignore */ }
  }

  create(scene) {
    const { THREE } = this

    const ringPositions = [
      { x: 15, y: 12, z: 10 },
      { x: -20, y: 8, z: 25 },
      { x: 30, y: 15, z: -15 },
      { x: -10, y: 20, z: -30 },
      { x: 45, y: 10, z: 30 },
      { x: -35, y: 18, z: -5 },
    ]

    ringPositions.forEach((pos, i) => {
      const ringGeo = new THREE.TorusGeometry(3, 0.3, 8, 24)
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.4,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.set(pos.x, pos.y, pos.z)
      // Randomly orient rings for variety
      ring.rotation.y = Math.random() * Math.PI
      scene.add(ring)

      this.rings.push({
        mesh: ring,
        passed: false,
        center: { x: pos.x, y: pos.y, z: pos.z },
        radius: 3, // ring outer radius for collision
      })
    })
  }

  update(physics, dt, time) {
    // Pulse unpassed rings
    this.rings.forEach((ring, i) => {
      if (ring.passed) return

      // Pulsing glow
      const pulse = 0.3 + Math.sin(time * 3 + i * 1.5) * 0.2
      ring.mesh.material.emissiveIntensity = pulse

      // Gentle bob
      ring.mesh.position.y = ring.center.y + Math.sin(time * 1.5 + i) * 0.5

      // Check collision
      const dx = physics.position.x - ring.center.x
      const dy = physics.position.y - ring.mesh.position.y
      const dz = physics.position.z - ring.center.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < ring.radius + 1.5) {
        this.passRing(i)
      }
    })
  }

  passRing(index) {
    const ring = this.rings[index]
    if (ring.passed) return

    ring.passed = true
    ring.mesh.material.color.setHex(0x00ff44)
    ring.mesh.material.emissive.setHex(0x00ff44)
    ring.mesh.material.emissiveIntensity = 1.0

    this.passedCount++
    this.score += 100

    // Persist score
    try {
      localStorage.setItem('flyzone-score', String(this.score))
    } catch { /* ignore */ }

    if (this.onRingPass) {
      this.onRingPass(index, this.score)
    }

    // All rings passed bonus
    if (this.passedCount >= this.totalRings && !this.celebrationDone) {
      this.celebrationDone = true
      this.score += 500
      try {
        localStorage.setItem('flyzone-score', String(this.score))
      } catch { /* ignore */ }
      if (this.onAllPassed) {
        this.onAllPassed(this.score)
      }
    }

    // Fade ring after a moment
    setTimeout(() => {
      ring.mesh.material.opacity = 0.3
      ring.mesh.material.transparent = true
    }, 1000)
  }

  getPassedCount() {
    return this.passedCount
  }

  dispose() {
    this.rings.forEach(ring => {
      if (ring.mesh.geometry) ring.mesh.geometry.dispose()
      if (ring.mesh.material) ring.mesh.material.dispose()
    })
    this.rings = []
  }
}
