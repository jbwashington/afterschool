export class VirtualFileSystem {
  constructor() {
    this.root = {
      type: 'folder',
      name: 'C:',
      children: {},
      path: 'C:'
    }
    this.storageKey = 'sixseven_fs'
  }

  init() {
    this.loadFromStorage()
    if (Object.keys(this.root.children).length === 0) {
      this.createDefaultStructure()
    }
  }

  createDefaultStructure() {
    // Windows folder
    this.createFolder('C:/Windows')
    this.createFolder('C:/Windows/System32')

    // Program Files
    this.createFolder('C:/Program Files')
    this.createFolder('C:/Program Files/sixsevenOS')

    // Documents and Settings
    this.createFolder('C:/Documents and Settings')
    this.createFolder('C:/Documents and Settings/User')
    this.createFolder('C:/Documents and Settings/User/Desktop')
    this.createFolder('C:/Documents and Settings/User/My Documents')
    this.createFolder('C:/Documents and Settings/User/My Documents/My Pictures')
    this.createFolder('C:/Documents and Settings/User/My Documents/My Music')

    // Create a welcome file
    this.createFile(
      'C:/Documents and Settings/User/My Documents/Welcome.txt',
      'Welcome to sixsevenOS!\n\nThis is a Windows XP-inspired web OS.\n\nHave fun exploring!'
    )

    this.saveToStorage()
  }

  parsePath(path) {
    // Normalize path separators
    path = path.replace(/\\/g, '/')

    // Remove trailing slash
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1)
    }

    // Split into parts
    const parts = path.split('/').filter(Boolean)

    return parts
  }

  getNode(path) {
    const parts = this.parsePath(path)

    // Handle root
    if (parts.length === 0 || (parts.length === 1 && parts[0] === 'C:')) {
      return this.root
    }

    let current = this.root
    const startIndex = parts[0] === 'C:' ? 1 : 0

    for (let i = startIndex; i < parts.length; i++) {
      if (!current.children || !current.children[parts[i]]) {
        return null
      }
      current = current.children[parts[i]]
    }

    return current
  }

  getParentPath(path) {
    const parts = this.parsePath(path)
    if (parts.length <= 1) return 'C:'
    parts.pop()
    return parts.join('/')
  }

  getBasename(path) {
    const parts = this.parsePath(path)
    return parts[parts.length - 1] || ''
  }

  exists(path) {
    return this.getNode(path) !== null
  }

  isFolder(path) {
    const node = this.getNode(path)
    return node && node.type === 'folder'
  }

  isFile(path) {
    const node = this.getNode(path)
    return node && node.type === 'file'
  }

  createFolder(path) {
    const parentPath = this.getParentPath(path)
    const name = this.getBasename(path)

    const parent = this.getNode(parentPath)
    if (!parent || parent.type !== 'folder') {
      // Create parent folders recursively
      this.createFolder(parentPath)
      return this.createFolder(path)
    }

    if (parent.children[name]) {
      return parent.children[name] // Already exists
    }

    const folder = {
      type: 'folder',
      name,
      path,
      children: {},
      createdAt: Date.now(),
      modifiedAt: Date.now()
    }

    parent.children[name] = folder
    return folder
  }

  createFile(path, content = '') {
    const parentPath = this.getParentPath(path)
    const name = this.getBasename(path)

    const parent = this.getNode(parentPath)
    if (!parent || parent.type !== 'folder') {
      throw new Error(`Parent folder does not exist: ${parentPath}`)
    }

    const file = {
      type: 'file',
      name,
      path,
      content,
      size: content.length,
      createdAt: Date.now(),
      modifiedAt: Date.now()
    }

    parent.children[name] = file
    this.saveToStorage()
    return file
  }

  readFile(path) {
    const node = this.getNode(path)
    if (!node || node.type !== 'file') {
      throw new Error(`File not found: ${path}`)
    }
    return node.content
  }

  writeFile(path, content) {
    const node = this.getNode(path)
    if (!node) {
      // Create new file
      return this.createFile(path, content)
    }

    if (node.type !== 'file') {
      throw new Error(`Cannot write to folder: ${path}`)
    }

    node.content = content
    node.size = content.length
    node.modifiedAt = Date.now()
    this.saveToStorage()
    return node
  }

  readDir(path) {
    const node = this.getNode(path)
    if (!node || node.type !== 'folder') {
      throw new Error(`Folder not found: ${path}`)
    }

    return Object.values(node.children).map(child => ({
      name: child.name,
      type: child.type,
      path: child.path,
      size: child.size || 0,
      modifiedAt: child.modifiedAt
    }))
  }

  delete(path) {
    const parentPath = this.getParentPath(path)
    const name = this.getBasename(path)

    const parent = this.getNode(parentPath)
    if (!parent || !parent.children[name]) {
      throw new Error(`Path not found: ${path}`)
    }

    delete parent.children[name]
    this.saveToStorage()
  }

  move(oldPath, newPath) {
    const node = this.getNode(oldPath)
    if (!node) {
      throw new Error(`Source not found: ${oldPath}`)
    }

    const newParentPath = this.getParentPath(newPath)
    const newName = this.getBasename(newPath)

    const newParent = this.getNode(newParentPath)
    if (!newParent || newParent.type !== 'folder') {
      throw new Error(`Destination folder not found: ${newParentPath}`)
    }

    // Remove from old location
    const oldParentPath = this.getParentPath(oldPath)
    const oldName = this.getBasename(oldPath)
    const oldParent = this.getNode(oldParentPath)
    delete oldParent.children[oldName]

    // Add to new location
    node.name = newName
    node.path = newPath
    newParent.children[newName] = node

    this.saveToStorage()
  }

  copy(sourcePath, destPath) {
    const node = this.getNode(sourcePath)
    if (!node) {
      throw new Error(`Source not found: ${sourcePath}`)
    }

    if (node.type === 'file') {
      this.createFile(destPath, node.content)
    } else {
      this.createFolder(destPath)
      // Copy children recursively
      for (const child of Object.values(node.children)) {
        const childDest = `${destPath}/${child.name}`
        this.copy(child.path, childDest)
      }
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.root))
    } catch (e) {
      console.warn('[fs] Failed to save to storage:', e)
    }
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        this.root = JSON.parse(data)
      }
    } catch (e) {
      console.warn('[fs] Failed to load from storage:', e)
    }
  }

  clear() {
    this.root.children = {}
    this.createDefaultStructure()
  }
}
