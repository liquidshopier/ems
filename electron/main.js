const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Backend server configuration
const BACKEND_PORT = process.env.PORT || 5000;
// In production, backend is bundled in the app.asar or resources
const BACKEND_PATH = isDev 
  ? path.join(__dirname, '..', 'backend', 'server.js')
  : (app.isPackaged 
      ? path.join(process.resourcesPath, 'backend', 'server.js')
      : path.join(__dirname, '..', 'backend', 'server.js'));

// Frontend build path
const FRONTEND_PATH = isDev
  ? 'http://localhost:3000'
  : (app.isPackaged
      ? `file://${path.join(__dirname, '..', 'frontend', 'build', 'index.html')}`
      : `file://${path.join(__dirname, '..', 'frontend', 'build', 'index.html')}`);

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add icon
    show: false, // Don't show until ready
  });

  // Load the app with retry logic for development
  const loadApp = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    
    if (isDev) {
      // In dev mode, retry loading if connection fails
      mainWindow.loadURL(FRONTEND_PATH).catch((error) => {
        console.log('Failed to load frontend, retrying in 2 seconds...', error);
        setTimeout(() => {
          loadApp();
        }, 2000);
      });
      // Open DevTools in development
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadURL(FRONTEND_PATH);
    }
  };

  // Handle failed page loads (set up before loading)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (isDev && validatedURL && validatedURL.includes('localhost:3000')) {
      console.log(`Failed to load ${validatedURL} (${errorCode}: ${errorDescription}), retrying in 2 seconds...`);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          loadApp();
        }
      }, 2000);
    } else if (!isDev) {
      console.error('Failed to load page:', errorCode, errorDescription, validatedURL);
    }
  });
  
  // Initial load
  loadApp();

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      
      // Focus on window
      if (isDev) {
        mainWindow.focus();
      }
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

function startBackendServer() {
  return new Promise((resolve, reject) => {
    // Check if backend server is already running (dev mode)
    if (isDev) {
      const http = require('http');
      const checkServer = () => {
        const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
          if (res.statusCode === 200) {
            console.log('Backend server already running');
            resolve();
          } else {
            startBackendProcess();
          }
        });
        req.on('error', () => {
          startBackendProcess();
        });
        req.setTimeout(1000, () => {
          req.destroy();
          startBackendProcess();
        });
      };
      
      setTimeout(checkServer, 1000);
    } else {
      startBackendProcess();
    }

    function startBackendProcess() {
      console.log('Starting backend server...');
      
      // Determine Node.js executable
      const nodeExecutable = process.execPath;
      
      // Start backend server
      const backendCwd = isDev 
        ? path.join(__dirname, '..', 'backend')
        : (app.isPackaged 
            ? process.resourcesPath 
            : path.dirname(BACKEND_PATH));
      
      // Set up environment variables for backend
      const backendEnv = {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: isDev ? 'development' : 'production',
      };

      // In production, set paths so backend can find its dependencies
      if (app.isPackaged) {
        const backendNodeModulesPath = path.join(process.resourcesPath, 'backend', 'node_modules');
        const backendDatabasePath = path.join(process.resourcesPath, 'backend', 'database', 'ems.db');
        
        // Set NODE_PATH to help backend find its modules
        backendEnv.NODE_PATH = backendNodeModulesPath;
        backendEnv.DB_PATH = backendDatabasePath;
        
        // Also add to PATH for native modules
        const pathSeparator = process.platform === 'win32' ? ';' : ':';
        backendEnv.PATH = `${backendNodeModulesPath}${pathSeparator}${process.env.PATH}`;
      }

      backendProcess = spawn(nodeExecutable, [BACKEND_PATH], {
        cwd: backendCwd,
        env: backendEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let serverReady = false;

      // Handle stdout
      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Backend] ${output}`);
        
        // Check if server is ready
        if (output.includes('Server running on port') && !serverReady) {
          serverReady = true;
          resolve();
        }
      });

      // Handle stderr
      backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString()}`);
      });

      // Handle process exit
      backendProcess.on('exit', (code) => {
        console.log(`Backend process exited with code ${code}`);
        if (code !== 0 && code !== null) {
          reject(new Error(`Backend server exited with code ${code}`));
        }
      });

      // Timeout for server startup
      setTimeout(() => {
        if (!serverReady) {
          // Assume server started (might have started before we attached listeners)
          const http = require('http');
          const checkHealth = () => {
            const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
              if (res.statusCode === 200) {
                serverReady = true;
                resolve();
              }
            });
            req.on('error', () => {
              // Server might still be starting
            });
          };
          checkHealth();
        }
      }, 5000);
    }
  });
}

function stopBackendServer() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Start backend server first
    await startBackendServer();
    
    // Create window
    createWindow();
    
    // Set application menu (optional - customize as needed)
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
          label: app.getName(),
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' }
          ]
        },
        {
          label: 'View',
          submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
          ]
        },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { role: 'close' }
          ]
        }
      ]));
    } else {
      Menu.setApplicationMenu(null); // Use default menu on Windows/Linux
    }
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    stopBackendServer();
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

