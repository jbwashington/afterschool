import { DroneModel } from './DroneModel.js'
import { DronePhysics } from './DronePhysics.js'
import { DroneControls } from './DroneControls.js'
import { Environment } from './Environment.js'
import { HUD } from './HUD.js'
import { RingSystem } from './RingSystem.js'

export class DroneScene {
  constructor(canvasWrapper, hudContainer, THREE) {
    this.THREE = THREE
    this.canvasWrapper = canvasWrapper
    this.hudContainer = hudContainer

    this.scene = null
    this.camera = null
    this.renderer = null
    this.animFrameId = null
    this.resizeObserver = null
    this.clock = null

    this.droneModel = null
    this.physics = null
    this.controls = null
    this.environment = null
    this.hud = null
    this.ringSystem = null

    this.cameraMode = 'third'
    this.cameraLerpSpeed = 0.05
  }

  async init() {
    const { THREE } = this

    // Scene
    this.scene = new THREE.Scene()

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    this.camera.position.set(0, 8, 12)

    // Renderer — try WebGL (WebGPU requires async setup that isn't widely available yet)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.canvasWrapper.appendChild(this.renderer.domElement)

    // Clock
    this.clock = new THREE.Clock()

    // Physics
    this.physics = new DronePhysics()

    // Controls
    this.controls = new DroneControls(this.canvasWrapper, this.physics)
    this.controls.init()
    this.controls.onCameraToggle = (mode) => {
      this.cameraMode = mode
      if (this.hud) this.hud.setCameraMode(mode)
    }
    this.controls.onReset = () => {
      this.physics.reset()
    }

    // Environment
    this.environment = new Environment(THREE)
    this.environment.create(this.scene)

    // Drone model
    this.droneModel = new DroneModel(THREE)
    const droneMesh = this.droneModel.create()
    this.scene.add(droneMesh)

    // Ring system
    this.ringSystem = new RingSystem(THREE)
    this.ringSystem.create(this.scene)
    this.ringSystem.onRingPass = (index, score) => {
      if (this.hud) this.hud.showFlash('+100 NICE!')
    }
    this.ringSystem.onAllPassed = (totalScore) => {
      if (this.hud) this.hud.showFlash(`ALL RINGS! +500 BONUS! Total: ${totalScore}`)
    }

    // HUD
    this.hud = new HUD(this.hudContainer)
    this.hud.create()

    // Focus management
    this.canvasWrapper.addEventListener('click', () => {
      this.controls.focus()
    })

    // Track focus state for HUD
    this.canvasWrapper.addEventListener('focus', () => {
      if (this.hud) this.hud.setFocused(true)
    })
    this.canvasWrapper.addEventListener('blur', () => {
      if (this.hud) this.hud.setFocused(false)
    })

    // Resize observer
    this.resizeObserver = new ResizeObserver(() => this.onResize())
    this.resizeObserver.observe(this.canvasWrapper)
    this.onResize()

    // Start loop
    this.animate()
  }

  onResize() {
    const width = this.canvasWrapper.clientWidth
    const height = this.canvasWrapper.clientHeight
    if (width === 0 || height === 0) return

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate())

    const dt = this.clock.getDelta()
    const time = this.clock.getElapsedTime()

    // Update systems
    this.controls.update()
    this.physics.update(dt)
    this.droneModel.update(this.physics, dt)
    this.environment.update(dt)
    this.ringSystem.update(this.physics, dt, time)

    // Camera follow
    this.updateCamera()

    // HUD
    this.hud.update(this.physics, this.ringSystem)
    this.hud.setFocused(this.controls.focused)

    // Render
    this.renderer.render(this.scene, this.camera)
  }

  updateCamera() {
    const { physics, camera, THREE } = this

    if (this.cameraMode === 'fpv') {
      // FPV: Camera at drone position, looking forward
      const cosY = Math.cos(physics.rotation.y)
      const sinY = Math.sin(physics.rotation.y)

      camera.position.set(
        physics.position.x,
        physics.position.y + 0.3,
        physics.position.z
      )

      const lookX = physics.position.x - sinY * 10
      const lookZ = physics.position.z - cosY * 10

      camera.lookAt(lookX, physics.position.y + 0.3, lookZ)
    } else {
      // Third person: smooth follow behind and above
      const cosY = Math.cos(physics.rotation.y)
      const sinY = Math.sin(physics.rotation.y)

      const targetX = physics.position.x + sinY * 8
      const targetY = physics.position.y + 4
      const targetZ = physics.position.z + cosY * 8

      camera.position.x += (targetX - camera.position.x) * this.cameraLerpSpeed
      camera.position.y += (targetY - camera.position.y) * this.cameraLerpSpeed
      camera.position.z += (targetZ - camera.position.z) * this.cameraLerpSpeed

      camera.lookAt(
        physics.position.x,
        physics.position.y,
        physics.position.z
      )
    }
  }

  dispose() {
    // Stop animation
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }

    // Disconnect observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    // Dispose subsystems
    if (this.controls) this.controls.destroy()
    if (this.hud) this.hud.destroy()
    if (this.droneModel) this.droneModel.dispose()
    if (this.ringSystem) this.ringSystem.dispose()
    if (this.environment) this.environment.dispose()

    // Traverse scene and dispose all geometries/materials
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose()
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
      }
    }
  }
}
