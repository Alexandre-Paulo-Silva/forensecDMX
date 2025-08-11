const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  listDir:      p => ipcRenderer.invoke('list-dir', p),
  getMetadata:  p => ipcRenderer.invoke('get-metadata', p),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile:   () => ipcRenderer.invoke('select-file'),
  readHex:      p => ipcRenderer.invoke('read-hex', p),
  exportPDF:    m => ipcRenderer.invoke('export-pdf', m),
  exportHexPDF: d => ipcRenderer.invoke('export-hexpdf', d),
  getTimeline:  dir => ipcRenderer.invoke('timeline:get', dir),
  // escaner de rede 
  getNetworkConnections: () => ipcRenderer.invoke('network:get-connections'),

  //PROCESSOS
  listProcesses:     () => ipcRenderer.invoke('process:list'),
  getProcessDetails: pid => ipcRenderer.invoke('process:get-details', pid),
  killProcess:       pid => ipcRenderer.invoke('process:kill', pid),

  // PDF 


    selectPdf: () => ipcRenderer.invoke('dialog:select-pdf'),
  analyzePdf: (filePath) => ipcRenderer.invoke('pdf:analyze', filePath)

});