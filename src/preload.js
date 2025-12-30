const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dictionary persistence methods
  getDictionary: () => ipcRenderer.invoke('store-get-dictionary'),
  setDictionary: (dictionary) => ipcRenderer.invoke('store-set-dictionary', dictionary),
  clearDictionary: () => ipcRenderer.invoke('store-clear-dictionary'),

  // Project management methods
  initializeFileSystem: () => ipcRenderer.invoke('project-initialize-filesystem'),
  loadProjects: () => ipcRenderer.invoke('project-load-projects'),
  saveProjects: (projectsData) => ipcRenderer.invoke('project-save-projects', projectsData),
  createProject: (projectData) => ipcRenderer.invoke('project-create-project', projectData),
  deleteProject: (projectId) => ipcRenderer.invoke('project-delete-project', projectId),
  getCurrentProject: () => ipcRenderer.invoke('project-get-current-project'),
  setCurrentProject: (projectId) => ipcRenderer.invoke('project-set-current-project', projectId),
  loadProjectDictionary: (projectId) => ipcRenderer.invoke('project-load-project-dictionary', projectId),
  saveProjectDictionary: (projectId, dictionary) => ipcRenderer.invoke('project-save-project-dictionary', projectId, dictionary),
  updateProjectMetadata: (projectId, metadata) => ipcRenderer.invoke('project-update-project-metadata', projectId, metadata),

  // Dialog methods
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showInputBox: (options) => ipcRenderer.invoke('show-input-box', options)
});
