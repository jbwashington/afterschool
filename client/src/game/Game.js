import * as THREE from 'three'
import { EntityFactory } from './EntityFactory.js'
import { AnimationManager } from './AnimationManager.js'

export class Game {
  constructor(container) {
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.entities = new Map()
    this.entityFactory = null
    this.animationManager = null
    this.clock = new THREE.Clock()
  }

  async init() {
    this.setupScene()
    this.setupCamera()
    this.setupRenderer()
    this.setupLights()
    this.entityFactory = new EntityFactory(this.scene)
    this.animationManager = new AnimationManager()

    // Handle resize
    window.addEventListener('resize', () => this.handleResize())

    // Start render loop
    this.animate()
  }

  setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 50)
  }

  setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    this.camera.position.set(0, 10, 15)
    this.camera.lookAt(0, 0, 0)
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'low-power', // Important for Pi performance
    })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = false // No dynamic shadows per PRD
    this.container.appendChild(this.renderer.domElement)
  }

  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambient)

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 0.8)
    sun.position.set(10, 20, 10)
    this.scene.add(sun)

    // Hemisphere light for natural sky/ground lighting
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x7ec850, 0.4)
    this.scene.add(hemi)
  }

  handleResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    const delta = this.clock.getDelta()

    // Update animations
    this.animationManager.update(delta, this.entities)

    // Render
    this.renderer.render(this.scene, this.camera)
  }

  loadWorld(worldState) {
    // Clear existing entities
    for (const [id, entity] of this.entities) {
      this.scene.remove(entity.mesh)
    }
    this.entities.clear()

    // Load entities from state
    for (const entityData of worldState.entities) {
      this.spawnEntity(entityData)
    }
  }

  syncWorld(worldState) {
    // Sync entity states
    const currentIds = new Set(this.entities.keys())
    const newIds = new Set(worldState.entities.map(e => e.id))

    // Remove entities that no longer exist
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        this.removeEntity(id)
      }
    }

    // Add/update entities
    for (const entityData of worldState.entities) {
      if (this.entities.has(entityData.id)) {
        this.updateEntity(entityData.id, entityData)
      } else {
        this.spawnEntity(entityData)
      }
    }
  }

  spawnEntity(entityData) {
    const entity = this.entityFactory.create(entityData)
    if (entity) {
      this.entities.set(entityData.id, entity)
      this.scene.add(entity.mesh)

      // Setup animation if specified
      if (entityData.animation) {
        this.animationManager.register(entityData.id, entityData.animation)
      }

      // Play spawn animation
      this.playSpawnAnimation(entity)
    }
    return entity
  }

  removeEntity(entityId) {
    const entity = this.entities.get(entityId)
    if (entity) {
      this.playRemoveAnimation(entity, () => {
        this.scene.remove(entity.mesh)
        this.entities.delete(entityId)
        this.animationManager.unregister(entityId)
      })
    }
  }

  updateEntity(entityId, updates) {
    const entity = this.entities.get(entityId)
    if (!entity) return

    if (updates.position) {
      entity.mesh.position.set(updates.position.x, updates.position.y, updates.position.z)
    }
    if (updates.rotation) {
      entity.mesh.rotation.set(updates.rotation.x, updates.rotation.y, updates.rotation.z)
    }
    if (updates.scale) {
      entity.mesh.scale.set(updates.scale.x, updates.scale.y, updates.scale.z)
    }
    if (updates.color !== undefined) {
      entity.mesh.material.color.setHex(updates.color)
    }
  }

  applyFeature(feature) {
    console.log('[game] Applying feature:', feature.name)

    if (feature.results) {
      for (const result of feature.results) {
        if (result.action === 'spawn' && result.entity) {
          this.spawnEntity(result.entity)
        }
      }
    }
  }

  applyUpdate(update) {
    if (Array.isArray(update)) {
      for (const u of update) {
        this.applySingleUpdate(u)
      }
    } else {
      this.applySingleUpdate(update)
    }
  }

  applySingleUpdate(update) {
    switch (update.type) {
      case 'spawn':
        this.spawnEntity(update.entity)
        break
      case 'color_change':
        this.updateEntity(update.entityId, { color: update.color })
        break
      case 'scale':
        const entity = this.entities.get(update.entityId)
        if (entity) {
          const scale = entity.mesh.scale
          scale.multiplyScalar(update.multiplier || 1.1)
        }
        break
    }
  }

  playSpawnAnimation(entity) {
    // Scale up from zero
    const targetScale = entity.mesh.scale.clone()
    entity.mesh.scale.set(0, 0, 0)

    const duration = 0.5
    let elapsed = 0

    const animate = () => {
      elapsed += this.clock.getDelta()
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // Ease out cubic

      entity.mesh.scale.lerpVectors(
        new THREE.Vector3(0, 0, 0),
        targetScale,
        eased
      )

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  playRemoveAnimation(entity, onComplete) {
    const startScale = entity.mesh.scale.clone()
    const duration = 0.3
    let elapsed = 0

    const animate = () => {
      elapsed += this.clock.getDelta()
      const t = Math.min(elapsed / duration, 1)
      const eased = Math.pow(t, 3) // Ease in cubic

      entity.mesh.scale.lerpVectors(
        startScale,
        new THREE.Vector3(0, 0, 0),
        eased
      )

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }
    animate()
  }

  changeSkyColor(color) {
    this.scene.background.setHex(color)
    this.scene.fog.color.setHex(color)
  }

  clearAll() {
    // Remove all entities except keep the scene
    for (const [id, entity] of this.entities) {
      this.scene.remove(entity.mesh)
      this.animationManager.unregister(id)
    }
    this.entities.clear()
    console.log('[game] Cleared all entities')
  }
}
