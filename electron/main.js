const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Configuration
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = process.env.PORT || 5000;
const ENABLE_DEVTOOLS = isDev || process.env.ENABLE_DEVTOOLS === 'true';
const ENABLE_LOGGING = isDev || process.env.ENABLE_LOGGING === 'true';

// Global state
let mainWindow = null;
let backendProcess = null;

// Logging utility (only in dev or when explicitly enabled)
function log(message) {
  if (ENABLE_LOGGING) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Get backend executable path
function getBackendPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'backend', 'server.js');
  }
  // Production: use backend.exe from resources
  const backendExe = path.join(process.resourcesPath, 'backend', 'backend.exe');
  return fs.existsSync(backendExe) ? backendExe : null;
}

// Get frontend path
function getFrontendPath() {
  if (isDev) {
    return 'http://localhost:3000';
  }
  return path.join(__dirname, '..', 'frontend', 'build', 'index.html');
}

// Create main window
function createWindow() {
  // Prevent multiple windows
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  const preloadPath = path.join(__dirname, 'preload.js');
  const frontendPath = getFrontendPath();

  log(`Creating window (dev: ${isDev}, frontend: ${frontendPath})`);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev && ENABLE_DEVTOOLS, // Only enable in dev mode
    },
    show: false, // Don't show until ready
    autoHideMenuBar: !isDev, // Hide menu bar in production
  });

  // Load frontend
  if (isDev) {
    const startURL = process.env.ELECTRON_START_URL || frontendPath;
    mainWindow.loadURL(startURL).catch((error) => {
      log(`Failed to load frontend: ${error.message}`);
      // Retry after delay in dev mode
      if (isDev) {
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.loadURL(startURL);
          }
        }, 2000);
      }
    });
  } else {
    mainWindow.loadFile(frontendPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      // DevTools only in dev mode
      if (isDev && ENABLE_DEVTOOLS) {
        mainWindow.webContents.openDevTools();
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

  // Handle failed loads (only log in production)
  if (!isDev) {
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (isMainFrame) {
        log(`Failed to load page: ${errorCode} - ${errorDescription}`);
      }
    });
  }
}

// Start backend server
function startBackendServer() {
  return new Promise((resolve, reject) => {
    // Check if server is already running (dev mode only)
    if (isDev) {
      const http = require('http');
      const checkServer = () => {
        const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
          if (res.statusCode === 200) {
            log('Backend server already running');
            resolve();
          } else {
            startBackendProcess();
          }
        });
        req.on('error', () => startBackendProcess());
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
      const backendPath = getBackendPath();
      
      if (!backendPath || !fs.existsSync(backendPath)) {
        const error = new Error(`Backend executable not found: ${backendPath}`);
        log(`Error: ${error.message}`);
        reject(error);
        return;
      }

      log(`Starting backend: ${backendPath}`);

      // Determine execution method
      const isExecutable = !backendPath.endsWith('.js');
      const nodeExecutable = isExecutable ? backendPath : process.execPath;
      const backendArgs = isExecutable ? [] : [backendPath];
      const backendCwd = isExecutable ? path.dirname(backendPath) : path.join(__dirname, '..', 'backend');

      // Set environment variables
      const backendEnv = {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: isDev ? 'development' : 'production',
      };

      // Set database path in production
      if (app.isPackaged && !isDev) {
        backendEnv.DB_PATH = path.join(process.resourcesPath, 'backend', 'database', 'ems.db');
      }

      // Spawn backend process
      backendProcess = spawn(nodeExecutable, backendArgs, {
        cwd: backendCwd,
        env: backendEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let serverReady = false;

      // Handle stdout
      backendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (ENABLE_LOGGING) {
          log(`[Backend] ${output}`);
        }
        
        // Check if server is ready
        if (output.includes('Server running on port') && !serverReady) {
          serverReady = true;
          log('Backend server started successfully');
          resolve();
        }
      });

      // Handle stderr
      backendProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (ENABLE_LOGGING) {
          log(`[Backend Error] ${error}`);
        }
      });

      // Handle process exit
      backendProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          const error = new Error(`Backend server exited with code ${code}`);
          log(`Error: ${error.message}`);
          if (!serverReady) {
            reject(error);
          }
        }
      });

      // Handle spawn errors
      backendProcess.on('error', (error) => {
        log(`Error spawning backend: ${error.message}`);
        reject(error);
      });

      // Timeout fallback - check health endpoint
      setTimeout(() => {
        if (!serverReady) {
          const http = require('http');
          const req = http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
            if (res.statusCode === 200) {
              serverReady = true;
              log('Backend server verified via health check');
              resolve();
            }
          });
          req.on('error', () => {
            // Server might still be starting, don't reject yet
          });
        }
      }, 5000);
    }
  });
}

// Stop backend server
function stopBackendServer() {
  if (backendProcess) {
    log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// App event handlers
app.whenReady().then(async () => {
  log('App ready, initializing...');
  
  // Create window first
  createWindow();

  // Hide menu bar in production (Windows)
  if (!isDev && mainWindow) {
    mainWindow.setMenuBarVisibility(false);
  }

  // Start backend server (non-blocking)
  try {
    await Promise.race([
      startBackendServer(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Backend startup timeout')), 10000)
      )
    ]);
    log('Backend server started');
  } catch (error) {
    log(`Backend startup error (continuing): ${error.message}`);
    // Continue even if backend fails - window should still work
  }

  // Windows uses default menu, no custom menu needed
});

// Handle second instance (focus existing window)
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Handle window close (Windows-only)
app.on('window-all-closed', () => {
  stopBackendServer();
  app.quit();
});

// Cleanup on quit
app.on('before-quit', () => {
  stopBackendServer();
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
