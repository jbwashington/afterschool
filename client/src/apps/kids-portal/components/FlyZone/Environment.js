export class Environment {
  constructor(THREE) {
    this.THREE = THREE
    this.windTurbineBlades = []
  }

  create(scene) {
    const { THREE } = this

    // Sky
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.003)

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.8)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0)
    sunLight.position.set(50, 100, 30)
    scene.add(sunLight)

    // Terrain
    this.createTerrain(scene)

    // Landing pad
    this.createLandingPad(scene)

    // Trees
    this.createTrees(scene)

    // Buildings
    this.createBuildings(scene)

    // Lake
    this.createLake(scene)

    // Wind turbines
    this.createWindTurbines(scene)
  }

  createTerrain(scene) {
    const { THREE } = this
    const geo = new THREE.PlaneGeometry(600, 600, 128, 128)
    geo.rotateX(-Math.PI / 2)

    // Displace vertices for rolling hills
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const y = Math.sin(x * 0.02) * 2 + Math.sin(z * 0.03) * 1.5 + Math.sin((x + z) * 0.01) * 3
      pos.setY(i, y)
    }
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a8c2a,
      flatShading: true,
    })
    const terrain = new THREE.Mesh(geo, mat)
    scene.add(terrain)
  }

  createLandingPad(scene) {
    const { THREE } = this
    // Flat circle at origin
    const padGeo = new THREE.CircleGeometry(3, 32)
    padGeo.rotateX(-Math.PI / 2)
    const padMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.position.y = 0.05
    scene.add(pad)

    // H marking
    const hShape = new THREE.Shape()
    // Left vertical
    hShape.moveTo(-0.8, -1)
    hShape.lineTo(-0.5, -1)
    hShape.lineTo(-0.5, -0.15)
    hShape.lineTo(0.5, -0.15)
    hShape.lineTo(0.5, -1)
    hShape.lineTo(0.8, -1)
    hShape.lineTo(0.8, 1)
    hShape.lineTo(0.5, 1)
    hShape.lineTo(0.5, 0.15)
    hShape.lineTo(-0.5, 0.15)
    hShape.lineTo(-0.5, 1)
    hShape.lineTo(-0.8, 1)
    hShape.lineTo(-0.8, -1)

    const hGeo = new THREE.ShapeGeometry(hShape)
    hGeo.rotateX(-Math.PI / 2)
    const hMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const hMark = new THREE.Mesh(hGeo, hMat)
    hMark.position.y = 0.06
    scene.add(hMark)
  }

  createTrees(scene) {
    const { THREE } = this

    // Use InstancedMesh for tree trunks and canopies
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 6)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const canopyGeo = new THREE.ConeGeometry(2, 4, 6)
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x228b22 })

    const treePositions = [
      { x: 20, z: 15 }, { x: -25, z: 20 }, { x: 30, z: -10 },
      { x: -15, z: -30 }, { x: 40, z: 25 }, { x: -40, z: -15 },
      { x: 10, z: -40 }, { x: -30, z: 40 }, { x: 50, z: -30 },
      { x: -50, z: 10 }, { x: 35, z: 45 }, { x: -20, z: -50 },
      { x: 60, z: 5 }, { x: -10, z: 55 }, { x: 45, z: -45 },
    ]

    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length)
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treePositions.length)
    const dummy = new THREE.Object3D()

    treePositions.forEach((pos, i) => {
      const groundY = this.getGroundHeight(pos.x, pos.z)

      // Trunk
      dummy.position.set(pos.x, groundY + 1.5, pos.z)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      trunkInst.setMatrixAt(i, dummy.matrix)

      // Canopy
      dummy.position.set(pos.x, groundY + 5, pos.z)
      dummy.updateMatrix()
      canopyInst.setMatrixAt(i, dummy.matrix)
    })

    scene.add(trunkInst)
    scene.add(canopyInst)
  }

  createBuildings(scene) {
    const { THREE } = this
    const buildings = [
      { x: -15, z: -12, w: 6, h: 8, d: 5, color: 0xcc6644 },
      { x: -8, z: -14, w: 4, h: 5, d: 4, color: 0x6688cc },
      { x: -18, z: -6, w: 5, h: 6, d: 6, color: 0xcccc44 },
      { x: -10, z: -8, w: 3, h: 10, d: 3, color: 0xcc4466 },
      { x: -22, z: -10, w: 4, h: 4, d: 5, color: 0x66ccaa },
    ]

    buildings.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d)
      const mat = new THREE.MeshStandardMaterial({ color: b.color })
      const mesh = new THREE.Mesh(geo, mat)
      const groundY = this.getGroundHeight(b.x, b.z)
      mesh.position.set(b.x, groundY + b.h / 2, b.z)
      scene.add(mesh)
    })
  }

  createLake(scene) {
    const { THREE } = this
    const lakeGeo = new THREE.CircleGeometry(15, 32)
    lakeGeo.rotateX(-Math.PI / 2)
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x3399ff,
      transparent: true,
      opacity: 0.6,
    })
    const lake = new THREE.Mesh(lakeGeo, lakeMat)
    lake.position.set(40, -1, 40)
    scene.add(lake)
  }

  createWindTurbines(scene) {
    const { THREE } = this
    const turbinePositions = [
      { x: -60, z: 30 },
      { x: -70, z: -20 },
      { x: 70, z: -40 },
    ]

    turbinePositions.forEach(pos => {
      const groundY = this.getGroundHeight(pos.x, pos.z)

      // Tower
      const towerGeo = new THREE.CylinderGeometry(0.3, 0.5, 20, 8)
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      const tower = new THREE.Mesh(towerGeo, towerMat)
      tower.position.set(pos.x, groundY + 10, pos.z)
      scene.add(tower)

      // Hub
      const hubGeo = new THREE.SphereGeometry(0.5, 8, 8)
      const hubMat = new THREE.MeshStandardMaterial({ color: 0xdddddd })
      const hub = new THREE.Mesh(hubGeo, hubMat)
      hub.position.set(pos.x, groundY + 20, pos.z)
      scene.add(hub)

      // Blades group
      const bladeGroup = new THREE.Group()
      bladeGroup.position.set(pos.x, groundY + 20, pos.z)

      for (let i = 0; i < 3; i++) {
        const bladeGeo = new THREE.BoxGeometry(0.3, 8, 0.05)
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
        const blade = new THREE.Mesh(bladeGeo, bladeMat)
        blade.position.y = 4
        const arm = new THREE.Group()
        arm.add(blade)
        arm.rotation.z = (i * Math.PI * 2) / 3
        bladeGroup.add(arm)
      }

      scene.add(bladeGroup)
      this.windTurbineBlades.push(bladeGroup)
    })
  }

  getGroundHeight(x, z) {
    return Math.sin(x * 0.02) * 2 + Math.sin(z * 0.03) * 1.5 + Math.sin((x + z) * 0.01) * 3
  }

  update(dt) {
    // Spin wind turbine blades
    this.windTurbineBlades.forEach(bladeGroup => {
      bladeGroup.rotation.z += 0.5 * dt
    })
  }

  dispose() {
    // InstancedMesh and other geometries are disposed by scene traversal in DroneScene
    this.windTurbineBlades = []
  }
}
