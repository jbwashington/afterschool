import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EntityFactory } from './EntityFactory.js'
import { AnimationManager } from './AnimationManager.js'

export class Game {
  constructor(container) {
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.entities = new Map()
    this.entityFactory = null
    this.animationManager = null
    this.clock = new THREE.Clock()
  }

  async init() {
    this.setupScene()
    this.setupCamera()
    this.setupRenderer()
    this.setupControls()
    this.setupLights()
    this.setupGround()
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

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.1
    this.controls.maxPolarAngle = Math.PI / 2.1 // Prevent going below ground
    this.controls.minDistance = 5
    this.controls.maxDistance = 50
    this.controls.target.set(0, 0, 0)
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

  setupGround() {
    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(40, 40)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x7ec850 })
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.y = 0
    this.scene.add(this.ground)

    // Add grid helper for visual reference
    const gridHelper = new THREE.GridHelper(40, 20, 0x5a9a40, 0x5a9a40)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
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

    // Update controls
    this.controls.update()

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

  changeGroundColor(color) {
    if (this.ground) {
      this.ground.material.color.setHex(color)
    }
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

  fitAll() {
    if (this.entities.size === 0) {
      this.resetView()
      return
    }

    // Calculate bounding box of all entities
    const box = new THREE.Box3()
    for (const entity of this.entities.values()) {
      box.expandByObject(entity.mesh)
    }

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.camera.fov * (Math.PI / 180)
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8

    // Ensure minimum distance
    cameraDistance = Math.max(cameraDistance, 10)

    // Animate to new position
    const targetPosition = new THREE.Vector3(
      center.x + cameraDistance * 0.5,
      center.y + cameraDistance * 0.5,
      center.z + cameraDistance * 0.5
    )

    this.animateCameraTo(targetPosition, center)
  }

  resetView() {
    const targetPosition = new THREE.Vector3(0, 10, 15)
    const targetLookAt = new THREE.Vector3(0, 0, 0)
    this.animateCameraTo(targetPosition, targetLookAt)
  }

  animateCameraTo(targetPosition, targetLookAt) {
    const startPosition = this.camera.position.clone()
    const startTarget = this.controls.target.clone()
    const duration = 0.5
    let elapsed = 0

    const animate = () => {
      elapsed += this.clock.getDelta()
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // Ease out cubic

      this.camera.position.lerpVectors(startPosition, targetPosition, eased)
      this.controls.target.lerpVectors(startTarget, targetLookAt, eased)

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  zoomIn() {
    const direction = new THREE.Vector3()
    direction.subVectors(this.controls.target, this.camera.position).normalize()
    this.camera.position.addScaledVector(direction, 2)
  }

  zoomOut() {
    const direction = new THREE.Vector3()
    direction.subVectors(this.controls.target, this.camera.position).normalize()
    this.camera.position.addScaledVector(direction, -2)
  }

  // Convert screen coordinates to world position on ground plane
  screenToWorld(screenX, screenY) {
    const rect = this.container.getBoundingClientRect()
    const x = ((screenX - rect.left) / rect.width) * 2 - 1
    const y = -((screenY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)

    // Intersect with ground plane (y = 0)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersection)

    if (intersection) {
      return { x: intersection.x, z: intersection.z }
    }
    return null
  }

  // Enable/disable orbit controls (useful during drag)
  setControlsEnabled(enabled) {
    this.controls.enabled = enabled
  }
}
