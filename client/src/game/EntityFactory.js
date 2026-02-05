import * as THREE from 'three'

export class EntityFactory {
  constructor(scene) {
    this.scene = scene
    this.meshGenerators = {
      box: this.createBox.bind(this),
      house: this.createHouse.bind(this),
      tree: this.createTree.bind(this),
      tower: this.createTower.bind(this),
      playground: this.createPlayground.bind(this),
      flowers: this.createFlowers.bind(this),
      pond: this.createPond.bind(this),
      lamp: this.createLamp.bind(this),
      robot_cat: this.createRobotCat.bind(this),
      butterfly: this.createButterfly.bind(this),
      rainbow: this.createRainbow.bind(this),
    }
  }

  create(entityData) {
    const generator = this.meshGenerators[entityData.mesh] || this.createBox
    const mesh = generator(entityData)

    // Apply position, rotation, scale
    if (entityData.position) {
      mesh.position.set(entityData.position.x, entityData.position.y, entityData.position.z)
    }
    if (entityData.rotation) {
      mesh.rotation.set(entityData.rotation.x, entityData.rotation.y, entityData.rotation.z)
    }
    if (entityData.scale) {
      mesh.scale.set(entityData.scale.x, entityData.scale.y, entityData.scale.z)
    }

    return {
      id: entityData.id,
      type: entityData.type,
      mesh,
      data: entityData,
    }
  }

  createBox(data) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshLambertMaterial({ color: data.color || 0xffffff })
    return new THREE.Mesh(geometry, material)
  }

  createHouse(data) {
    const group = new THREE.Group()

    // Base
    const baseGeom = new THREE.BoxGeometry(1, 0.8, 1)
    const baseMat = new THREE.MeshLambertMaterial({ color: data.color || 0xffd93d })
    const base = new THREE.Mesh(baseGeom, baseMat)
    base.position.y = 0.4
    group.add(base)

    // Roof
    const roofGeom = new THREE.ConeGeometry(0.8, 0.5, 4)
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xc0392b })
    const roof = new THREE.Mesh(roofGeom, roofMat)
    roof.position.y = 1.05
    roof.rotation.y = Math.PI / 4
    group.add(roof)

    // Door
    const doorGeom = new THREE.BoxGeometry(0.2, 0.4, 0.05)
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 })
    const door = new THREE.Mesh(doorGeom, doorMat)
    door.position.set(0, 0.2, 0.52)
    group.add(door)

    return group
  }

  createTree(data) {
    const group = new THREE.Group()

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8)
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 })
    const trunk = new THREE.Mesh(trunkGeom, trunkMat)
    trunk.position.y = 0.4
    group.add(trunk)

    // Foliage (low-poly cone)
    const foliageGeom = new THREE.ConeGeometry(0.5, 1.2, 6)
    const foliageMat = new THREE.MeshLambertMaterial({ color: data.color || 0x2d5a27 })
    const foliage = new THREE.Mesh(foliageGeom, foliageMat)
    foliage.position.y = 1.2
    group.add(foliage)

    return group
  }

  createTower(data) {
    const group = new THREE.Group()

    // Tower body
    const bodyGeom = new THREE.CylinderGeometry(0.3, 0.4, 2, 8)
    const bodyMat = new THREE.MeshLambertMaterial({ color: data.color || 0x9b59b6 })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.position.y = 1
    group.add(body)

    // Tower top
    const topGeom = new THREE.ConeGeometry(0.5, 0.5, 8)
    const topMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c })
    const top = new THREE.Mesh(topGeom, topMat)
    top.position.y = 2.25
    group.add(top)

    // Windows
    const windowGeom = new THREE.BoxGeometry(0.1, 0.15, 0.1)
    const windowMat = new THREE.MeshLambertMaterial({ color: 0xffeb3b })
    for (let i = 0; i < 4; i++) {
      const window = new THREE.Mesh(windowGeom, windowMat)
      const angle = (i / 4) * Math.PI * 2
      window.position.set(Math.sin(angle) * 0.35, 1.2 + (i % 2) * 0.4, Math.cos(angle) * 0.35)
      group.add(window)
    }

    return group
  }

  createPlayground(data) {
    const group = new THREE.Group()

    // Slide
    const slideGeom = new THREE.BoxGeometry(0.3, 0.8, 1)
    const slideMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b })
    const slide = new THREE.Mesh(slideGeom, slideMat)
    slide.rotation.x = -0.3
    slide.position.set(-0.5, 0.4, 0)
    group.add(slide)

    // Swing frame
    const frameGeom = new THREE.BoxGeometry(0.05, 1, 0.05)
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x3498db })
    const leftPole = new THREE.Mesh(frameGeom, frameMat)
    leftPole.position.set(0.5, 0.5, -0.3)
    group.add(leftPole)
    const rightPole = new THREE.Mesh(frameGeom, frameMat)
    rightPole.position.set(0.5, 0.5, 0.3)
    group.add(rightPole)

    // Swing top bar
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.7), frameMat)
    topBar.position.set(0.5, 1, 0)
    group.add(topBar)

    // Swing seat
    const seatGeom = new THREE.BoxGeometry(0.2, 0.03, 0.15)
    const seatMat = new THREE.MeshLambertMaterial({ color: 0xf39c12 })
    const seat = new THREE.Mesh(seatGeom, seatMat)
    seat.position.set(0.5, 0.3, 0)
    group.add(seat)

    return group
  }

  createFlowers(data) {
    const group = new THREE.Group()
    const colors = [0xff69b4, 0xffb6c1, 0xffc0cb, 0xff1493]

    for (let i = 0; i < 5; i++) {
      const flower = new THREE.Group()

      // Stem
      const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6)
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x228b22 })
      const stem = new THREE.Mesh(stemGeom, stemMat)
      stem.position.y = 0.15
      flower.add(stem)

      // Petals (simple sphere)
      const petalGeom = new THREE.SphereGeometry(0.08, 8, 8)
      const petalMat = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] })
      const petals = new THREE.Mesh(petalGeom, petalMat)
      petals.position.y = 0.35
      flower.add(petals)

      // Position randomly
      flower.position.set(
        (Math.random() - 0.5) * 0.8,
        0,
        (Math.random() - 0.5) * 0.8
      )

      group.add(flower)
    }

    return group
  }

  createPond(data) {
    const geometry = new THREE.CircleGeometry(1, 16)
    const material = new THREE.MeshLambertMaterial({
      color: data.color || 0x4fc3f7,
      transparent: true,
      opacity: 0.8,
    })
    const pond = new THREE.Mesh(geometry, material)
    pond.rotation.x = -Math.PI / 2
    return pond
  }

  createLamp(data) {
    const group = new THREE.Group()

    // Pole
    const poleGeom = new THREE.CylinderGeometry(0.03, 0.05, 1, 8)
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const pole = new THREE.Mesh(poleGeom, poleMat)
    pole.position.y = 0.5
    group.add(pole)

    // Light
    const lightGeom = new THREE.SphereGeometry(0.1, 8, 8)
    const lightMat = new THREE.MeshLambertMaterial({
      color: data.color || 0xfff8dc,
      emissive: 0xfff8dc,
      emissiveIntensity: 0.5,
    })
    const light = new THREE.Mesh(lightGeom, lightMat)
    light.position.y = 1.1
    group.add(light)

    return group
  }

  createRobotCat(data) {
    const group = new THREE.Group()

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.4, 0.3, 0.6)
    const bodyMat = new THREE.MeshLambertMaterial({ color: data.color || 0xc0c0c0 })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.position.y = 0.25
    group.add(body)

    // Head
    const headGeom = new THREE.BoxGeometry(0.35, 0.3, 0.35)
    const head = new THREE.Mesh(headGeom, bodyMat)
    head.position.set(0, 0.45, 0.25)
    group.add(head)

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.04, 8, 8)
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.3 })
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat)
    leftEye.position.set(-0.08, 0.5, 0.4)
    group.add(leftEye)
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat)
    rightEye.position.set(0.08, 0.5, 0.4)
    group.add(rightEye)

    // Ears
    const earGeom = new THREE.ConeGeometry(0.06, 0.12, 4)
    const leftEar = new THREE.Mesh(earGeom, bodyMat)
    leftEar.position.set(-0.12, 0.65, 0.2)
    group.add(leftEar)
    const rightEar = new THREE.Mesh(earGeom, bodyMat)
    rightEar.position.set(0.12, 0.65, 0.2)
    group.add(rightEar)

    // Tail
    const tailGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6)
    const tail = new THREE.Mesh(tailGeom, bodyMat)
    tail.position.set(0, 0.35, -0.35)
    tail.rotation.x = Math.PI / 4
    group.add(tail)

    return group
  }

  createButterfly(data) {
    const group = new THREE.Group()

    // Body
    const bodyGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x333333 })
    const body = new THREE.Mesh(bodyGeom, bodyMat)
    body.rotation.x = Math.PI / 2
    group.add(body)

    // Wings
    const wingGeom = new THREE.CircleGeometry(0.15, 8)
    const wingMat = new THREE.MeshLambertMaterial({
      color: data.color || 0xff6b6b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    })

    const leftWing = new THREE.Mesh(wingGeom, wingMat)
    leftWing.position.set(-0.1, 0, 0)
    leftWing.rotation.y = -0.3
    group.add(leftWing)

    const rightWing = new THREE.Mesh(wingGeom, wingMat)
    rightWing.position.set(0.1, 0, 0)
    rightWing.rotation.y = 0.3
    group.add(rightWing)

    return group
  }

  createRainbow(data) {
    const group = new THREE.Group()
    const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3]

    colors.forEach((color, i) => {
      const curve = new THREE.EllipseCurve(
        0, 0,
        3 - i * 0.3, 2 - i * 0.2,
        0, Math.PI,
        false,
        0
      )
      const points = curve.getPoints(32)
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({ color, linewidth: 3 })
      const arc = new THREE.Line(geometry, material)
      arc.rotation.x = Math.PI / 2
      group.add(arc)
    })

    return group
  }
}
