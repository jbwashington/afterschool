export class AnimationManager {
  constructor() {
    this.animations = new Map()
  }

  register(entityId, animationConfig) {
    this.animations.set(entityId, {
      config: animationConfig,
      state: this.initState(animationConfig),
    })
  }

  unregister(entityId) {
    this.animations.delete(entityId)
  }

  initState(config) {
    switch (config.type) {
      case 'wander':
        return {
          targetX: 0,
          targetZ: 0,
          moveTimer: 0,
        }
      case 'flutter':
        return {
          phase: Math.random() * Math.PI * 2,
          baseY: 0,
        }
      case 'shimmer':
        return {
          phase: 0,
        }
      case 'fade_in':
        return {
          elapsed: 0,
          complete: false,
        }
      default:
        return {}
    }
  }

  update(delta, entities) {
    for (const [entityId, animation] of this.animations) {
      const entity = entities.get(entityId)
      if (!entity) continue

      this.updateAnimation(entity, animation, delta)
    }
  }

  updateAnimation(entity, animation, delta) {
    const { config, state } = animation
    const mesh = entity.mesh

    switch (config.type) {
      case 'wander':
        this.updateWander(mesh, config, state, delta)
        break
      case 'flutter':
        this.updateFlutter(mesh, config, state, delta)
        break
      case 'shimmer':
        this.updateShimmer(mesh, config, state, delta)
        break
      case 'fade_in':
        this.updateFadeIn(mesh, config, state, delta)
        break
    }
  }

  updateWander(mesh, config, state, delta) {
    const speed = config.speed || 0.5
    const radius = config.radius || 5

    state.moveTimer -= delta

    // Pick new target periodically
    if (state.moveTimer <= 0) {
      state.targetX = (Math.random() - 0.5) * radius * 2
      state.targetZ = (Math.random() - 0.5) * radius * 2
      state.moveTimer = 2 + Math.random() * 3
    }

    // Move towards target
    const dx = state.targetX - mesh.position.x
    const dz = state.targetZ - mesh.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist > 0.1) {
      mesh.position.x += (dx / dist) * speed * delta
      mesh.position.z += (dz / dist) * speed * delta

      // Face movement direction
      mesh.rotation.y = Math.atan2(dx, dz)
    }
  }

  updateFlutter(mesh, config, state, delta) {
    const height = config.height || 2

    if (state.baseY === 0) {
      state.baseY = mesh.position.y
    }

    state.phase += delta * 3

    // Bobbing motion
    mesh.position.y = state.baseY + Math.sin(state.phase) * 0.2

    // Side to side
    mesh.position.x += Math.sin(state.phase * 0.7) * delta * 0.5
    mesh.position.z += Math.cos(state.phase * 0.5) * delta * 0.3

    // Wing flap (rotate around Y)
    mesh.rotation.z = Math.sin(state.phase * 8) * 0.3
  }

  updateShimmer(mesh, config, state, delta) {
    state.phase += delta * 2

    if (mesh.material) {
      mesh.material.opacity = 0.6 + Math.sin(state.phase) * 0.2
    }
  }

  updateFadeIn(mesh, config, state, delta) {
    if (state.complete) return

    const duration = (config.duration || 2000) / 1000

    state.elapsed += delta

    if (state.elapsed >= duration) {
      state.complete = true
      if (mesh.material) {
        mesh.material.opacity = 1
      }
    } else {
      const t = state.elapsed / duration
      if (mesh.material) {
        mesh.material.opacity = t
        mesh.material.transparent = true
      }
    }
  }
}
