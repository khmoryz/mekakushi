const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;

// Get user data directory
const userDataPath = app.getPath('userData');
const dictionaryPath = path.join(userDataPath, 'maskingDictionary.json');

// プロジェクト管理用のパス
const projectsFile = path.join(userDataPath, 'projects.json');
const currentProjectFile = path.join(userDataPath, 'current-project.json');
const projectsDir = path.join(userDataPath, 'projects');

// Helper functions for dictionary persistence
function loadDictionary() {
  try {
    if (fs.existsSync(dictionaryPath)) {
      const data = fs.readFileSync(dictionaryPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading dictionary:', error);
  }
  return {};
}

function saveDictionary(dictionary) {
  try {
    // Ensure directory exists
    fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving dictionary:', error);
    return false;
  }
}

// プロジェクト管理用のヘルパー関数
function ensureDirectories() {
  try {
    // メインディレクトリ
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    // プロジェクトディレクトリ
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    return true;
  } catch (error) {
    console.error('Error ensuring directories:', error);
    return false;
  }
}

function initializeDefaultFiles() {
  try {
    // projects.json
    if (!fs.existsSync(projectsFile)) {
      const defaultProjects = {
        version: '1.0',
        projects: [],
        lastModified: new Date().toISOString()
      };
      fs.writeFileSync(projectsFile, JSON.stringify(defaultProjects, null, 2));
    }

    // current-project.json
    if (!fs.existsSync(currentProjectFile)) {
      const defaultCurrentProject = {
        version: '1.0',
        currentProjectId: null,
        lastModified: new Date().toISOString()
      };
      fs.writeFileSync(currentProjectFile, JSON.stringify(defaultCurrentProject, null, 2));
    }

    return true;
  } catch (error) {
    console.error('Error initializing default files:', error);
    return false;
  }
}

function getProjectDir(projectId) {
  return path.join(projectsDir, `project-${projectId}`);
}

function getProjectDictionaryPath(projectId) {
  return path.join(getProjectDir(projectId), 'dictionary.json');
}

function getProjectMetadataPath(projectId) {
  return path.join(getProjectDir(projectId), 'metadata.json');
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#161821'
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for dictionary persistence
ipcMain.handle('store-get-dictionary', () => {
  return loadDictionary();
});

ipcMain.handle('store-set-dictionary', (event, dictionary) => {
  return saveDictionary(dictionary);
});

ipcMain.handle('store-clear-dictionary', () => {
  try {
    if (fs.existsSync(dictionaryPath)) {
      fs.unlinkSync(dictionaryPath);
    }
    return true;
  } catch (error) {
    console.error('Error clearing dictionary:', error);
    return false;
  }
});

// プロジェクト管理用のIPCハンドラー
ipcMain.handle('project-initialize-filesystem', () => {
  try {
    ensureDirectories();
    initializeDefaultFiles();
    return true;
  } catch (error) {
    console.error('Error initializing filesystem:', error);
    return false;
  }
});

ipcMain.handle('project-load-projects', () => {
  try {
    if (fs.existsSync(projectsFile)) {
      const data = fs.readFileSync(projectsFile, 'utf8');
      return JSON.parse(data);
    }
    return { version: '1.0', projects: [], lastModified: new Date().toISOString() };
  } catch (error) {
    console.error('Error loading projects:', error);
    return { version: '1.0', projects: [], lastModified: new Date().toISOString() };
  }
});

ipcMain.handle('project-save-projects', (event, projectsData) => {
  try {
    fs.writeFileSync(projectsFile, JSON.stringify(projectsData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving projects:', error);
    return false;
  }
});

ipcMain.handle('project-create-project', (event, projectData) => {
  try {
    const projectDir = getProjectDir(projectData.id);

    // プロジェクトディレクトリを作成
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // 空の辞書ファイルを作成
    const dictionaryPath = getProjectDictionaryPath(projectData.id);
    const emptyDictionary = {
      projectId: projectData.id,
      entries: {},
      version: '1.0',
      lastModified: new Date().toISOString()
    };
    fs.writeFileSync(dictionaryPath, JSON.stringify(emptyDictionary, null, 2));

    // メタデータファイルを作成
    const metadataPath = getProjectMetadataPath(projectData.id);
    const metadata = {
      projectId: projectData.id,
      name: projectData.name,
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      version: '1.0'
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return true;
  } catch (error) {
    console.error('Error creating project:', error);
    return false;
  }
});

ipcMain.handle('project-delete-project', (event, projectId) => {
  try {
    const projectDir = getProjectDir(projectId);

    if (fs.existsSync(projectDir)) {
      // プロジェクトディレクトリを再帰的に削除
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
});

ipcMain.handle('project-get-current-project', () => {
  try {
    if (fs.existsSync(currentProjectFile)) {
      const data = fs.readFileSync(currentProjectFile, 'utf8');
      return JSON.parse(data);
    }
    return { version: '1.0', currentProjectId: null, lastModified: new Date().toISOString() };
  } catch (error) {
    console.error('Error getting current project:', error);
    return { version: '1.0', currentProjectId: null, lastModified: new Date().toISOString() };
  }
});

ipcMain.handle('project-set-current-project', (event, projectId) => {
  try {
    const currentProjectData = {
      version: '1.0',
      currentProjectId: projectId,
      lastModified: new Date().toISOString()
    };
    fs.writeFileSync(currentProjectFile, JSON.stringify(currentProjectData, null, 2));
    return true;
  } catch (error) {
    console.error('Error setting current project:', error);
    return false;
  }
});

ipcMain.handle('project-load-project-dictionary', (event, projectId) => {
  try {
    const dictionaryPath = getProjectDictionaryPath(projectId);
    if (fs.existsSync(dictionaryPath)) {
      const data = fs.readFileSync(dictionaryPath, 'utf8');
      return JSON.parse(data);
    }

    // 辞書ファイルが存在しない場合は空の辞書を作成
    const emptyDictionary = {
      projectId: projectId,
      entries: {},
      version: '1.0',
      lastModified: new Date().toISOString()
    };
    fs.writeFileSync(dictionaryPath, JSON.stringify(emptyDictionary, null, 2));
    return emptyDictionary;
  } catch (error) {
    console.error('Error loading project dictionary:', error);
    return {
      projectId: projectId,
      entries: {},
      version: '1.0',
      lastModified: new Date().toISOString()
    };
  }
});

ipcMain.handle('project-save-project-dictionary', (event, projectId, dictionary) => {
  try {
    const dictionaryPath = getProjectDictionaryPath(projectId);
    fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving project dictionary:', error);
    return false;
  }
});

ipcMain.handle('project-update-project-metadata', (event, projectId, metadata) => {
  try {
    const metadataPath = getProjectMetadataPath(projectId);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating project metadata:', error);
    return false;
  }
});

// ダイアログ用のIPCハンドラー
ipcMain.handle('show-message-box', async (event, options) => {
  try {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
  } catch (error) {
    console.error('Error showing message box:', error);
    return { response: 1, checkboxChecked: false }; // キャンセル相当
  }
});

ipcMain.handle('show-input-box', async (event, options) => {
  try {
    // Electronには標準的な入力ダイアログがないため、カスタム実装
    // 今回は簡単にするため、メッセージボックスで代用し、
    // レンダラープロセス側でHTMLダイアログを使用する
    return { success: true, value: '' };
  } catch (error) {
    console.error('Error showing input box:', error);
    return { success: false, value: null };
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
