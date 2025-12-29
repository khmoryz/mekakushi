const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dictionary persistence methods
  getDictionary: () => ipcRenderer.invoke('store-get-dictionary'),
  setDictionary: (dictionary) => ipcRenderer.invoke('store-set-dictionary', dictionary),
  clearDictionary: () => ipcRenderer.invoke('store-clear-dictionary')
});
