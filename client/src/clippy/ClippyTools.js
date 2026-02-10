// Tool definitions and execution for Clippy OS Assistant

// App name mappings for user-friendly tips
const APP_NAMES = {
  notepad: { name: 'Notepad', icon: '📝', tip: 'Double-click the 📝 icon on your desktop!' },
  winamp: { name: 'Winamp', icon: '🎵', tip: 'Double-click the 🎵 icon on your desktop!' },
  beatlab: { name: 'BeatLab', icon: '🎹', tip: 'Double-click the 🎹 icon on your desktop! Click the grid to make beats!' },
  kids_portal: { name: 'Kids Only Portal', icon: '🌈', tip: 'Double-click the 🌈 Kids Portal icon on your desktop!' },
  my_computer: { name: 'My Computer', icon: '💻', tip: 'Double-click the 💻 icon on your desktop!' },
  my_documents: { name: 'My Documents', icon: '📁', tip: 'Double-click the 📁 icon on your desktop!' },
  recycle_bin: { name: 'Recycle Bin', icon: '🗑️', tip: 'Double-click the 🗑️ icon on your desktop!' }
}

// Zone name mappings for Kids Portal
const ZONE_NAMES = {
  'fly-zone': { name: 'Fly Zone', icon: '🚁', description: 'Drones & aviation' },
  'robot-lab': { name: 'Robot Lab', icon: '🤖', description: 'Robotics & coding' },
  'sports-arena': { name: 'Sports Arena', icon: '⚽', description: 'Soccer & sports' },
  'kid-biz': { name: 'Kid Biz', icon: '💰', description: 'Business empire game' },
  'art-studio': { name: 'Art Studio', icon: '🎨', description: 'Drawing & creativity' },
  'play-zone': { name: 'Play Zone', icon: '🎮', description: 'Games & puzzles' },
  'maker-space': { name: 'Maker Space', icon: '🔧', description: 'Building & tinkering' },
  'ai-helper': { name: 'AI Helper', icon: '✨', description: 'Buddy Bot chat' },
  'my-stuff': { name: 'My Stuff', icon: '⭐', description: 'Saved favorites' }
}

export class ClippyTools {
  constructor(os) {
    this.os = os
  }

  // Execute a tool call and return result with teaching tip
  async execute(toolCall) {
    const { name, arguments: args } = toolCall

    switch (name) {
      case 'openApp':
        return this.openApp(args.appId)
      case 'closeWindow':
        return this.closeWindow(args.windowId)
      case 'listOpenWindows':
        return this.listOpenWindows()
      case 'toggleStartMenu':
        return this.toggleStartMenu()
      case 'navigateToZone':
        return this.navigateToZone(args.zoneId)
      case 'reportBug':
        return this.reportBug(args.title, args.description, args.steps)
      case 'listBugReports':
        return this.listBugReports()
      default:
        return { success: false, message: `Unknown tool: ${name}` }
    }
  }

  openApp(appId) {
    const appInfo = APP_NAMES[appId]
    if (!appInfo) {
      return {
        success: false,
        message: `I don't know that app. Try: notepad, winamp, beatlab, kids_portal, my_computer, my_documents, or recycle_bin.`
      }
    }

    try {
      const win = this.os.windowManager.openApp(appId)
      if (win) {
        return {
          success: true,
          action: `Opening ${appInfo.name}...`,
          tip: `💡 Tip: ${appInfo.tip}`,
          windowId: win.id
        }
      } else {
        return { success: false, message: `Couldn't open ${appInfo.name}. That's weird!` }
      }
    } catch (error) {
      return { success: false, message: `Oops! Something went wrong opening ${appInfo.name}.` }
    }
  }

  closeWindow(windowId) {
    const win = this.os.windowManager.getWindow(windowId)
    if (!win) {
      return { success: false, message: `I couldn't find that window.` }
    }

    try {
      const title = win.title || 'Window'
      this.os.windowManager.closeWindow(windowId)
      return {
        success: true,
        action: `Closed ${title}!`,
        tip: `💡 Tip: Click the X button in the top-right corner of any window to close it!`
      }
    } catch (error) {
      return { success: false, message: `Couldn't close the window.` }
    }
  }

  listOpenWindows() {
    const windows = this.os.windowManager.getAllWindows()

    if (windows.length === 0) {
      return {
        success: true,
        action: `No windows are open right now.`,
        tip: `💡 Tip: Double-click an icon on the desktop or use the Start menu to open apps!`,
        windows: []
      }
    }

    const windowList = windows.map(w => ({
      id: w.id,
      title: w.title || 'Untitled',
      icon: w.icon || '🪟'
    }))

    return {
      success: true,
      action: `You have ${windows.length} window${windows.length > 1 ? 's' : ''} open:`,
      windows: windowList,
      tip: `💡 Tip: Click on a button in the taskbar at the bottom to switch between windows!`
    }
  }

  toggleStartMenu() {
    try {
      this.os.startMenu.toggle()
      const isOpen = this.os.startMenu.isOpen
      return {
        success: true,
        action: isOpen ? `Opened the Start menu!` : `Closed the Start menu!`,
        tip: `💡 Tip: Click the Start button in the bottom-left corner anytime!`
      }
    } catch (error) {
      return { success: false, message: `Couldn't toggle the Start menu.` }
    }
  }

  navigateToZone(zoneId) {
    const zoneInfo = ZONE_NAMES[zoneId]
    if (!zoneInfo) {
      return {
        success: false,
        message: `I don't know that zone. Try: fly-zone, robot-lab, kid-biz, art-studio, play-zone, maker-space, ai-helper, or my-stuff.`
      }
    }

    // First, open Kids Portal if not already open
    let portalWindow = null
    const allWindows = this.os.windowManager.getAllWindows()
    for (const win of allWindows) {
      if (win.appInstance?.navigateToZone) {
        portalWindow = win
        break
      }
    }

    if (!portalWindow) {
      // Open Kids Portal first
      portalWindow = this.os.windowManager.openApp('kids_portal')
    }

    // Try to navigate to the zone
    if (portalWindow?.appInstance?.navigateToZone) {
      try {
        portalWindow.appInstance.navigateToZone(zoneId)
        return {
          success: true,
          action: `Taking you to ${zoneInfo.name}! ${zoneInfo.icon}`,
          tip: `💡 Tip: In Kids Portal, click any zone icon to explore it anytime!`
        }
      } catch (error) {
        return {
          success: false,
          message: `Couldn't navigate to ${zoneInfo.name}. The Kids Portal might still be loading.`
        }
      }
    }

    return {
      success: true,
      action: `I opened Kids Portal for you! Click on ${zoneInfo.icon} ${zoneInfo.name} to explore ${zoneInfo.description}.`,
      tip: `💡 Tip: Each zone icon in Kids Portal leads to something fun!`
    }
  }

  reportBug(title, description, steps = '') {
    try {
      const bug = this.os.clippy.bugTracker.reportBug(title, description, steps)
      return {
        success: true,
        action: `Bug report saved! 🐛`,
        tip: `💡 Thanks for helping make sixsevenOS better! Bug #${bug.id} is saved.`,
        bugId: bug.id
      }
    } catch (error) {
      return { success: false, message: `Couldn't save the bug report. Try telling me again?` }
    }
  }

  listBugReports() {
    try {
      const bugs = this.os.clippy.bugTracker.getBugReports()

      if (bugs.length === 0) {
        return {
          success: true,
          action: `No bug reports yet! Everything seems to be working great! 🎉`,
          bugs: []
        }
      }

      return {
        success: true,
        action: `You've reported ${bugs.length} bug${bugs.length > 1 ? 's' : ''}:`,
        bugs: bugs.map(b => ({
          id: b.id,
          title: b.title,
          status: b.status,
          reportedAt: b.reportedAt
        })),
        tip: `💡 Thanks for helping find problems!`
      }
    } catch (error) {
      return { success: false, message: `Couldn't load bug reports.` }
    }
  }

  // Get current OS state for context
  getOsState() {
    const windows = this.os.windowManager.getAllWindows()
    return {
      openWindows: windows.map(w => ({
        id: w.id,
        title: w.title || 'Untitled'
      }))
    }
  }
}
