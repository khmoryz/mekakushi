const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;

// Get user data directory
const userDataPath = app.getPath('userData');
const dictionaryPath = path.join(userDataPath, 'maskingDictionary.json');

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
