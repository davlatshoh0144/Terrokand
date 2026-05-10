const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openCarpetGame: () => ipcRenderer.invoke('open-carpet-game'),
  closeCarpetGame: () => ipcRenderer.invoke('close-carpet-game'),
  quitGame: () => ipcRenderer.invoke('quit-game'),
});

console.log('Terrokand - Electron wrapper loaded');
