export class DroneModel {
  constructor(THREE) {
    this.THREE = THREE
    this.group = null
    this.propellers = []
    this.propellerSpeeds = [1, -1, 1, -1] // counter-rotating
  }

  create() {
    const { THREE } = this
    this.group = new THREE.Group()

    // Body - blue box
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.15, 0.6)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2266cc })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    this.group.add(body)

    // Arms - 4 diagonal cylinders
    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x444444 })
    const armPositions = [
      { x: 0.35, z: 0.35, ry: Math.PI / 4 },
      { x: -0.35, z: 0.35, ry: -Math.PI / 4 },
      { x: -0.35, z: -0.35, ry: Math.PI / 4 },
      { x: 0.35, z: -0.35, ry: -Math.PI / 4 },
    ]

    armPositions.forEach((pos, i) => {
      // Arm
      const arm = new THREE.Mesh(armGeo, armMat)
      arm.position.set(pos.x * 0.5, 0, pos.z * 0.5)
      arm.rotation.z = Math.PI / 2
      arm.rotation.y = pos.ry
      this.group.add(arm)

      // Motor housing
      const motorGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08)
      const motorMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
      const motor = new THREE.Mesh(motorGeo, motorMat)
      motor.position.set(pos.x, 0.1, pos.z)
      this.group.add(motor)

      // Propeller
      const propGeo = new THREE.TorusGeometry(0.15, 0.015, 4, 16)
      const propMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.8
      })
      const prop = new THREE.Mesh(propGeo, propMat)
      prop.position.set(pos.x, 0.16, pos.z)
      prop.rotation.x = Math.PI / 2
      this.group.add(prop)
      this.propellers.push(prop)
    })

    // Front LED (green)
    const frontLedGeo = new THREE.SphereGeometry(0.04)
    const frontLedMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8
    })
    const frontLed = new THREE.Mesh(frontLedGeo, frontLedMat)
    frontLed.position.set(0, 0, -0.35)
    this.group.add(frontLed)

    // Back LED (red)
    const backLedGeo = new THREE.SphereGeometry(0.04)
    const backLedMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    })
    const backLed = new THREE.Mesh(backLedGeo, backLedMat)
    backLed.position.set(0, 0, 0.35)
    this.group.add(backLed)

    return this.group
  }

  update(physics, dt) {
    if (!this.group) return

    // Position
    this.group.position.set(
      physics.position.x,
      physics.position.y,
      physics.position.z
    )

    // Rotation (yaw + visual tilt)
    this.group.rotation.set(
      physics.tilt.x,
      physics.rotation.y,
      physics.tilt.z
    )

    // Spin propellers based on thrust
    const thrustLevel = physics.isLanded && physics.input.thrust <= 0 ? 0.1 : 1.0
    const spinSpeed = 15 * thrustLevel * dt

    this.propellers.forEach((prop, i) => {
      prop.rotation.z += this.propellerSpeeds[i] * spinSpeed
    })
  }

  dispose() {
    if (!this.group) return
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    })
  }
}
