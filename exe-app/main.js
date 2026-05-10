const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

let mainWindow;
let carpetWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1280, width - 100),
    height: Math.min(720, height - 100),
    minWidth: 800,
    minHeight: 600,
    title: 'Terrokand',
    icon: path.join(__dirname, 'game-dist/assets/title-screen.jpg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#001a33',
    fullscreenable: true,
    autoHideMenuBar: true,
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[main:${level}] ${message} (${sourceId}:${line})`);
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedUrl) => {
    console.log(`[main:load-failed] ${code} ${description} ${validatedUrl}`);
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.log(`[main:render-gone] ${details.reason}`);
  });

  // Load the local game files
  mainWindow.loadFile(path.join(__dirname, 'game-dist/index.html'));

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Maximize for best game experience
    mainWindow.maximize();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Enable DevTools in development (F12)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    // F11 for fullscreen toggle
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });
}

function openCarpetGame() {
  if (carpetWindow) {
    if (carpetWindow.isMinimized()) carpetWindow.restore();
    carpetWindow.focus();
    return;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  carpetWindow = new BrowserWindow({
    width: Math.min(1280, width - 100),
    height: Math.min(720, height - 100),
    minWidth: 800,
    minHeight: 600,
    title: 'Magic Carpet Ride',
    icon: path.join(__dirname, 'carpet-dist/images/title-screen.jpg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: '#0f172a',
    fullscreenable: true,
    autoHideMenuBar: true,
  });

  carpetWindow.loadFile(path.join(__dirname, 'carpet-dist/index.html'));

  carpetWindow.once('ready-to-show', () => {
    carpetWindow.show();
    carpetWindow.maximize();
  });

  carpetWindow.on('closed', () => {
    carpetWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus();
    }
  });

  // Enable DevTools in development (F12)
  carpetWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      carpetWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    if (input.key === 'F11') {
      carpetWindow.setFullScreen(!carpetWindow.isFullScreen());
      event.preventDefault();
    }
  });
}

function closeCarpetGame() {
  if (carpetWindow && !carpetWindow.isDestroyed()) {
    carpetWindow.close();
  }
}

// IPC handlers
ipcMain.handle('open-carpet-game', () => {
  openCarpetGame();
});

ipcMain.handle('close-carpet-game', () => {
  closeCarpetGame();
});

ipcMain.handle('quit-game', () => {
  app.quit();
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
