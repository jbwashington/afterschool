export class DronePhysics {
  constructor() {
    this.position = { x: 0, y: 2, z: 0 }
    this.velocity = { x: 0, y: 0, z: 0 }
    this.rotation = { x: 0, y: 0, z: 0 } // pitch, yaw, roll
    this.tilt = { x: 0, z: 0 } // current tilt for visual lean

    // Tuning
    this.gravity = -9.8
    this.liftForce = 18
    this.moveForce = 12
    this.turnSpeed = 2.0
    this.maxTilt = 0.4
    this.dragCoeff = 0.97
    this.tiltLerp = 0.08
    this.maxSpeed = 20
    this.ceiling = 200
    this.worldRadius = 300

    // Battery
    this.battery = 100
    this.batteryDrain = 2 // per second while thrusting
    this.batteryRecharge = 8 // per second while landed
    this.isLanded = true

    // Input state (set by DroneControls)
    this.input = {
      forward: 0,  // -1 to 1
      strafe: 0,   // -1 to 1
      thrust: 0,   // -1 to 1 (up/down)
      turn: 0,     // -1 to 1
    }
  }

  update(dt) {
    // Clamp dt to prevent physics explosion on tab-away
    dt = Math.min(dt, 0.05)

    const { input, position, velocity, rotation } = this

    // Battery management
    const isThrusting = input.thrust > 0 || input.forward !== 0 || input.strafe !== 0
    if (isThrusting && !this.isLanded) {
      this.battery = Math.max(0, this.battery - this.batteryDrain * dt)
    } else if (this.isLanded) {
      this.battery = Math.min(100, this.battery + this.batteryRecharge * dt)
    }

    const hasPower = this.battery > 0

    // Yaw rotation
    if (hasPower) {
      rotation.y += input.turn * this.turnSpeed * dt
    }

    // Calculate forward/right vectors from yaw
    const cosY = Math.cos(rotation.y)
    const sinY = Math.sin(rotation.y)

    // Apply movement forces relative to drone heading
    if (hasPower) {
      const forwardX = -sinY * input.forward * this.moveForce * dt
      const forwardZ = -cosY * input.forward * this.moveForce * dt
      const strafeX = cosY * input.strafe * this.moveForce * dt
      const strafeZ = -sinY * input.strafe * this.moveForce * dt

      velocity.x += forwardX + strafeX
      velocity.z += forwardZ + strafeZ
    }

    // Vertical thrust
    if (hasPower && input.thrust !== 0) {
      velocity.y += input.thrust * this.liftForce * dt
    }

    // Gravity always applies
    velocity.y += this.gravity * dt

    // Drag
    velocity.x *= this.dragCoeff
    velocity.z *= this.dragCoeff
    velocity.y *= this.dragCoeff

    // Clamp speed
    const hSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
    if (hSpeed > this.maxSpeed) {
      const scale = this.maxSpeed / hSpeed
      velocity.x *= scale
      velocity.z *= scale
    }
    velocity.y = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, velocity.y))

    // Update position
    position.x += velocity.x * dt
    position.y += velocity.y * dt
    position.z += velocity.z * dt

    // Ground collision
    const groundHeight = this.getGroundHeight(position.x, position.z)
    if (position.y <= groundHeight) {
      position.y = groundHeight
      velocity.y = Math.max(0, velocity.y)
      this.isLanded = true
    } else {
      this.isLanded = false
    }

    // Ceiling
    if (position.y > this.ceiling) {
      position.y = this.ceiling
      velocity.y = Math.min(0, velocity.y)
    }

    // World bounds (soft push back)
    const distFromCenter = Math.sqrt(position.x ** 2 + position.z ** 2)
    if (distFromCenter > this.worldRadius) {
      const pushBack = (distFromCenter - this.worldRadius) * 0.1
      const angle = Math.atan2(position.x, position.z)
      velocity.x -= Math.sin(angle) * pushBack
      velocity.z -= Math.cos(angle) * pushBack
    }

    // Visual tilt (lean into movement)
    const targetTiltX = -input.forward * this.maxTilt
    const targetTiltZ = input.strafe * this.maxTilt
    this.tilt.x += (targetTiltX - this.tilt.x) * this.tiltLerp
    this.tilt.z += (targetTiltZ - this.tilt.z) * this.tiltLerp
  }

  getGroundHeight(x, z) {
    // Match the terrain displacement in Environment.js
    return Math.sin(x * 0.02) * 2 + Math.sin(z * 0.03) * 1.5 + Math.sin((x + z) * 0.01) * 3
  }

  getSpeed() {
    return Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2)
  }

  getAltitude() {
    const ground = this.getGroundHeight(this.position.x, this.position.z)
    return Math.max(0, this.position.y - ground)
  }

  getHeading() {
    // Returns heading in degrees (0 = north/negative Z)
    let deg = (this.rotation.y * 180 / Math.PI) % 360
    if (deg < 0) deg += 360
    return deg
  }

  reset() {
    this.position = { x: 0, y: 2, z: 0 }
    this.velocity = { x: 0, y: 0, z: 0 }
    this.rotation = { x: 0, y: 0, z: 0 }
    this.tilt = { x: 0, z: 0 }
    this.battery = 100
    this.isLanded = true
  }
}
