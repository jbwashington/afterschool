import $ from 'jquery'
import * as THREE from 'three'
import './styles/main.css'

// jQuery demo
let clickCount = 0
$('#demo-btn').on('click', function() {
  clickCount++
  $('#click-count').text(`Clicks: ${clickCount}`)
})

// Three.js demo - rotating cube
const container = document.getElementById('three-container')
const width = container.clientWidth
const height = container.clientHeight

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
camera.position.z = 5

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)
renderer.setPixelRatio(window.devicePixelRatio)
container.appendChild(renderer.domElement)

// Create a cube
const geometry = new THREE.BoxGeometry(2, 2, 2)
const material = new THREE.MeshStandardMaterial({
  color: 0x3b82f6,
  metalness: 0.3,
  roughness: 0.4,
})
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 1)
pointLight.position.set(5, 5, 5)
scene.add(pointLight)

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
}
animate()

// Handle resize
window.addEventListener('resize', () => {
  const w = container.clientWidth
  const h = container.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
})

// HMR - accept updates without full reload
if (import.meta.hot) {
  import.meta.hot.accept()
}

console.log('🎮 App initialized')
