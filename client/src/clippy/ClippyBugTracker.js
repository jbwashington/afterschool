// Bug tracker for Clippy - stores bugs in VirtualFileSystem

const BUGS_PATH = 'C:/Program Files/sixsevenOS/clippy/bugs'
const BUGS_INDEX_FILE = `${BUGS_PATH}/bugs.json`

export class ClippyBugTracker {
  constructor(fileSystem) {
    this.fileSystem = fileSystem
    this.bugs = []
    this.nextId = 1
    this.init()
  }

  init() {
    // Ensure bugs directory exists
    if (!this.fileSystem.exists(BUGS_PATH)) {
      this.fileSystem.createFolder(BUGS_PATH)
    }

    // Load existing bugs
    this.loadBugs()
  }

  loadBugs() {
    try {
      if (this.fileSystem.exists(BUGS_INDEX_FILE)) {
        const content = this.fileSystem.readFile(BUGS_INDEX_FILE)
        const data = JSON.parse(content)
        this.bugs = data.bugs || []
        this.nextId = data.nextId || 1
      }
    } catch (error) {
      console.warn('[ClippyBugTracker] Failed to load bugs:', error)
      this.bugs = []
      this.nextId = 1
    }
  }

  saveBugs() {
    try {
      const data = {
        bugs: this.bugs,
        nextId: this.nextId
      }
      this.fileSystem.writeFile(BUGS_INDEX_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('[ClippyBugTracker] Failed to save bugs:', error)
    }
  }

  reportBug(title, description, steps = '', osState = null) {
    const bug = {
      id: this.nextId++,
      title: title,
      description: description,
      steps: steps,
      status: 'open',
      reportedAt: new Date().toISOString(),
      osState: osState
    }

    this.bugs.push(bug)
    this.saveBugs()

    // Also save individual bug file for detailed view
    try {
      const bugFilePath = `${BUGS_PATH}/bug_${bug.id}.json`
      this.fileSystem.writeFile(bugFilePath, JSON.stringify(bug, null, 2))
    } catch (error) {
      console.warn('[ClippyBugTracker] Failed to save individual bug file:', error)
    }

    return bug
  }

  getBugReports() {
    return this.bugs.filter(b => b.status !== 'deleted')
  }

  getBug(bugId) {
    return this.bugs.find(b => b.id === bugId)
  }

  updateBugStatus(bugId, status) {
    const bug = this.getBug(bugId)
    if (bug) {
      bug.status = status
      bug.updatedAt = new Date().toISOString()
      this.saveBugs()
      return bug
    }
    return null
  }

  deleteBug(bugId) {
    const bug = this.getBug(bugId)
    if (bug) {
      bug.status = 'deleted'
      this.saveBugs()
      return true
    }
    return false
  }

  getOpenBugs() {
    return this.bugs.filter(b => b.status === 'open')
  }

  getResolvedBugs() {
    return this.bugs.filter(b => b.status === 'resolved')
  }

  clearAllBugs() {
    this.bugs = []
    this.nextId = 1
    this.saveBugs()
  }
}
