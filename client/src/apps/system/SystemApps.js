import { BaseApp } from '../BaseApp.js'

// My Computer
export const MyComputerApp = {
  id: 'my_computer',
  title: 'My Computer',
  icon: '\uD83D\uDCBB',
  defaultWidth: 600,
  defaultHeight: 400,
  minWidth: 400,
  minHeight: 300,
  create: (window, windowManager) => {
    const content = document.createElement('div')
    content.style.padding = '16px'
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 16px;">
        <div style="text-align: center; cursor: pointer;">
          <div style="font-size: 48px;">\uD83D\uDCBD</div>
          <div style="font-size: 11px;">Local Disk (C:)</div>
        </div>
        <div style="text-align: center; cursor: pointer;">
          <div style="font-size: 48px;">\uD83D\uDCBF</div>
          <div style="font-size: 11px;">DVD Drive (D:)</div>
        </div>
        <div style="text-align: center; cursor: pointer;">
          <div style="font-size: 48px;">\uD83D\uDCC1</div>
          <div style="font-size: 11px;">Shared Documents</div>
        </div>
      </div>
    `
    window.setContent(content)
    return new BaseApp(window, windowManager)
  }
}

// My Documents
export const MyDocumentsApp = {
  id: 'my_documents',
  title: 'My Documents',
  icon: '\uD83D\uDCC1',
  defaultWidth: 600,
  defaultHeight: 400,
  minWidth: 400,
  minHeight: 300,
  create: (window, windowManager) => {
    const content = document.createElement('div')
    content.style.padding = '16px'
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 16px;">
        <div style="text-align: center; cursor: pointer;">
          <div style="font-size: 48px;">\uD83D\uDCC4</div>
          <div style="font-size: 11px;">readme.txt</div>
        </div>
        <div style="text-align: center; cursor: pointer;">
          <div style="font-size: 48px;">\uD83C\uDFDE\uFE0F</div>
          <div style="font-size: 11px;">My Pictures</div>
        </div>
        <div style="text-align: center; cursor: pointer;">
          <div style="font-size: 48px;">\uD83C\uDFB5</div>
          <div style="font-size: 11px;">My Music</div>
        </div>
      </div>
    `
    window.setContent(content)
    return new BaseApp(window, windowManager)
  }
}

// Recycle Bin
export const RecycleBinApp = {
  id: 'recycle_bin',
  title: 'Recycle Bin',
  icon: '\uD83D\uDDD1\uFE0F',
  defaultWidth: 500,
  defaultHeight: 350,
  minWidth: 300,
  minHeight: 200,
  create: (window, windowManager) => {
    const content = document.createElement('div')
    content.style.padding = '16px'
    content.style.textAlign = 'center'
    content.style.color = '#666'
    content.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 16px;">\uD83D\uDDD1\uFE0F</div>
      <p>The Recycle Bin is empty.</p>
    `
    window.setContent(content)
    return new BaseApp(window, windowManager)
  }
}
