import { BaseApp } from '../BaseApp.js'

export class Notepad extends BaseApp {
  constructor(window, windowManager) {
    super(window, windowManager)
    this.textarea = null
    this.currentFile = null
    this.content = ''
    this.isModified = false
  }

  init() {
    super.init()
    this.createContent()
    this.bindEvents()
    this.updateTitle()
  }

  createContent() {
    this.textarea = document.createElement('textarea')
    this.textarea.className = 'notepad-textarea'
    this.textarea.placeholder = 'Start typing...'
    this.textarea.value = this.content
    this.window.setContent(this.textarea)
  }

  bindEvents() {
    this.textarea.addEventListener('input', () => {
      this.content = this.textarea.value
      if (!this.isModified) {
        this.isModified = true
        this.updateTitle()
      }
    })

    // Handle keyboard shortcuts
    this.textarea.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            this.save()
            break
          case 'n':
            e.preventDefault()
            this.newFile()
            break
          case 'o':
            e.preventDefault()
            this.open()
            break
        }
      }
    })
  }

  updateTitle() {
    const filename = this.currentFile || 'Untitled'
    const modified = this.isModified ? '*' : ''
    this.window.setTitle(`${modified}${filename} - Notepad`)
  }

  newFile() {
    if (this.isModified) {
      // Would show save dialog in full implementation
      if (!confirm('Do you want to save changes?')) {
        return
      }
    }
    this.content = ''
    this.textarea.value = ''
    this.currentFile = null
    this.isModified = false
    this.updateTitle()
  }

  open() {
    // In a full implementation, would use file picker
    // For now, use a simple prompt
    const content = prompt('Paste content to open:')
    if (content !== null) {
      this.content = content
      this.textarea.value = content
      this.currentFile = 'Pasted Content.txt'
      this.isModified = false
      this.updateTitle()
    }
  }

  save() {
    if (!this.currentFile) {
      this.saveAs()
      return
    }
    // Mark as saved
    this.isModified = false
    this.updateTitle()
    console.log('Saved:', this.currentFile, this.content)
  }

  saveAs() {
    const filename = prompt('Enter filename:', 'Untitled.txt')
    if (filename) {
      this.currentFile = filename
      this.save()
    }
  }

  onFocus() {
    this.textarea?.focus()
  }

  destroy() {
    super.destroy()
  }
}

// App definition for registry
export const NotepadApp = {
  id: 'notepad',
  title: 'Untitled - Notepad',
  icon: '\uD83D\uDCDD',
  defaultWidth: 500,
  defaultHeight: 400,
  minWidth: 300,
  minHeight: 200,
  menuItems: [
    { id: 'file', label: 'File' },
    { id: 'edit', label: 'Edit' },
    { id: 'format', label: 'Format' },
    { id: 'view', label: 'View' },
    { id: 'help', label: 'Help' },
  ],
  create: (window, windowManager) => {
    const app = new Notepad(window, windowManager)
    app.init()
    return app
  }
}
