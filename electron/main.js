const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Create log file for debugging
let logFile = '';
function getLogFile() {
  if (!logFile) {
    try {
      logFile = path.join(app.getPath('userData'), 'app.log');
    } catch (error) {
      // If app not ready, use temp location
      logFile = path.join(require('os').tmpdir(), 'ems-app.log');
    }
  }
  return logFile;
}

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    const logPath = getLogFile();
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    // If we can't write to file, at least try console
    console.error('Failed to write to log file:', error);
  }
  // Also log to console
  console.log(message);
}

// Prevent multiple instances - MUST be called before app.whenReady()
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Log startup
logToFile('========================================');
logToFile('App starting...');
logToFile('isDev: ' + (process.env.NODE_ENV === 'development' || !app.isPackaged));
logToFile('isPackaged: ' + app.isPackaged);
logToFile('Log file: ' + getLogFile());
logToFile('========================================');

let mainWindow;
let backendProcess;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Backend server configuration
const BACKEND_PORT = process.env.PORT || 5000;
// Backend path will be calculated when needed
function getBackendExecutablePath() {
  if (isDev) {
    // In dev, use server.js
    return path.join(__dirname, '..', 'backend', 'server.js');
  } else if (app.isPackaged) {
    // In production, use backend.exe from extraResources
    const backendExe = path.join(process.resourcesPath, 'backend', 'backend.exe');
    if (fs.existsSync(backendExe)) {
      return backendExe;
    }
    // Fallback to server.js if exe doesn't exist
    return path.join(process.resourcesPath, 'backend', 'server.js');
  } else {
    return path.join(__dirname, '..', 'backend', 'server.js');
  }
}

// Frontend build path - will be set correctly when app is ready
let FRONTEND_PATH = '';

function createWindow() {
  // Prevent multiple windows
  if (mainWindow && !mainWindow.isDestroyed()) {
    logToFile('[Window] Window already exists, focusing...');
    mainWindow.focus();
    return;
  }
  
  // Determine paths based on environment
  let preloadPath, frontendPath;
  
  if (isDev) {
    preloadPath = path.join(__dirname, 'preload.js');
    frontendPath = 'http://localhost:3000';
  } else if (app.isPackaged) {
    // In production, use simple path - Electron handles ASAR automatically
    preloadPath = path.join(__dirname, 'preload.js');
    frontendPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
  } else {
    preloadPath = path.join(__dirname, 'preload.js');
    frontendPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html'); // Use file path, not file:// URL
  }
  
  // Update global FRONTEND_PATH
  FRONTEND_PATH = frontendPath;
  
  logToFile('[Window] Creating window...');
  logToFile('[Window] isDev: ' + isDev);
  logToFile('[Window] isPackaged: ' + app.isPackaged);
  logToFile('[Window] App path: ' + app.getAppPath());
  logToFile('[Window] Frontend path: ' + frontendPath);
  logToFile('[Window] Preload path: ' + preloadPath);
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
      webPreferences: {
      preload: preloadPath,
      devTools: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: true, // Show immediately for debugging
  });
  
  // Show window immediately for debugging
  mainWindow.show();
  
  // Always open DevTools for debugging
  mainWindow.webContents.openDevTools();

  // Load the app - simple like working example
  if (isDev) {
    // In dev mode, use loadURL for HTTP
    if (process.env.ELECTRON_START_URL) {
      mainWindow.loadURL(process.env.ELECTRON_START_URL);
    } else {
      mainWindow.loadURL(FRONTEND_PATH);
    }
  } else {
    // In production, use loadFile - simple direct call like working example
    mainWindow.loadFile(FRONTEND_PATH);
  }
  
  // Handle failed page loads (set up after loading)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (isDev && validatedURL && validatedURL.includes('localhost:3000')) {
      logToFile(`Failed to load ${validatedURL} (${errorCode}: ${errorDescription}), retrying in 2 seconds...`);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(FRONTEND_PATH);
        }
      }, 2000);
    } else if (!isDev && validatedURL && validatedURL.includes('static/')) {
      logToFile(`[Window] ✗ Failed to load resource: ${errorCode} - ${validatedURL}`);
    }
  });

  // Handle failed page loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isDev && validatedURL && validatedURL.includes('localhost:3000')) {
      logToFile(`Failed to load ${validatedURL} (${errorCode}: ${errorDescription}), retrying in 2 seconds...`);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(FRONTEND_PATH);
        }
      }, 2000);
    } else if (!isDev) {
      if (isMainFrame) {
        logToFile('[Window] Failed to load page: ' + errorCode + ' - ' + errorDescription + ' - ' + validatedURL);
      } else if (validatedURL && validatedURL.includes('static/')) {
        logToFile(`[Window] ✗ Failed to load resource: ${errorCode} - ${validatedURL}`);
      }
    }
  });
  
  // Log when page is fully loaded and check if React rendered
  mainWindow.webContents.on('did-finish-load', () => {
    logToFile('[Window] Page finished loading');
  });
  
  // Add event listeners for debugging (duplicate removed - already handled above)
  mainWindow.webContents.on('dom-ready', () => {
    logToFile('[Window] DOM is ready');
  });
  
  mainWindow.webContents.on('did-start-loading', () => {
    logToFile('[Window] Started loading page');
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('[Window] ready-to-show event fired');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      // Ensure DevTools are open for debugging
      if (!isDev) {
        mainWindow.webContents.openDevTools();
      }
    }
  });
  
  // Fallback: show window after delay if ready-to-show doesn't fire
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) {
        console.log('[Window] Forcing window to show (fallback)');
        mainWindow.show();
        mainWindow.focus();
      }
      // Log current URL
      const currentURL = mainWindow.webContents.getURL();
      console.log('[Window] Current URL:', currentURL);
      
      // Show debug info in window if page is blank
      mainWindow.webContents.executeJavaScript(`
        if (document.body && document.body.innerHTML.trim() === '') {
          const debugDiv = document.createElement('div');
          debugDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #1e1e1e; color: #d4d4d4; padding: 10px; font-family: monospace; font-size: 12px; z-index: 9999;';
          debugDiv.innerHTML = '<strong>Debug Info:</strong><br>URL: ' + window.location.href + '<br>Ready: ' + document.readyState;
          document.body.appendChild(debugDiv);
        }
      `);
    }
  }, 2000);

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
      logToFile('[Backend] Starting backend server...');
      
      // Get backend executable path
      const BACKEND_EXE_PATH = getBackendExecutablePath();
      logToFile('[Backend] Backend executable path: ' + BACKEND_EXE_PATH);
      
      // Verify executable exists
      if (!fs.existsSync(BACKEND_EXE_PATH)) {
        logToFile('[Backend] ✗ Backend executable does NOT exist: ' + BACKEND_EXE_PATH);
        reject(new Error('Backend executable not found: ' + BACKEND_EXE_PATH));
        return;
      }
      logToFile('[Backend] ✓ Backend executable exists');
      
      // Determine how to run backend
      let nodeExecutable, backendArgs, backendCwd;
      
      if (isDev || BACKEND_EXE_PATH.endsWith('.js')) {
        // Running as Node.js script (dev mode)
        nodeExecutable = process.execPath;
        backendArgs = [BACKEND_EXE_PATH];
        backendCwd = path.join(__dirname, '..', 'backend');
        logToFile('[Backend] Running as Node.js script');
      } else {
        // Running as executable (production)
        nodeExecutable = BACKEND_EXE_PATH;
        backendArgs = []; // No arguments needed for pkg executable
        backendCwd = path.dirname(BACKEND_EXE_PATH);
        logToFile('[Backend] Running as executable');
      }
      
      logToFile('[Backend] Node executable: ' + nodeExecutable);
      logToFile('[Backend] Working directory: ' + backendCwd);
      
      // Set up environment variables for backend
      const backendEnv = {
        ...process.env,
        PORT: BACKEND_PORT,
        NODE_ENV: isDev ? 'development' : 'production',
      };

      // In production, set DB_PATH for the backend executable
      if (app.isPackaged && !isDev) {
        const backendDatabasePath = path.join(process.resourcesPath, 'backend', 'database', 'ems.db');
        backendEnv.DB_PATH = backendDatabasePath;
        
        logToFile('[Backend] Resources path: ' + process.resourcesPath);
        logToFile('[Backend] Database path: ' + backendDatabasePath);
        
        // Check if database directory exists
        const dbDir = path.dirname(backendDatabasePath);
        if (fs.existsSync(dbDir)) {
          logToFile('[Backend] ✓ Database directory exists: ' + dbDir);
        } else {
          logToFile('[Backend] ✗ Database directory does NOT exist: ' + dbDir);
        }
      }

      logToFile('[Backend] Spawning backend process...');
      logToFile('[Backend] Command: ' + nodeExecutable + (backendArgs.length > 0 ? ' ' + backendArgs.join(' ') : ''));
      
      // Spawn backend process
      // If it's an executable, run it directly; otherwise use Electron's Node.js
      backendProcess = spawn(nodeExecutable, backendArgs, {
        cwd: backendCwd,
        env: backendEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      
      // Check if process was created (pid will be undefined if spawn failed immediately)
      if (backendProcess.pid) {
        logToFile('[Backend] ✓ Process spawned successfully (PID: ' + backendProcess.pid + ')');
      } else {
        logToFile('[Backend] ⚠ Process spawned but PID is undefined (may be starting)');
      }

      let serverReady = false;

      // Handle stdout
      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logToFile('[Backend] ' + output.trim());
        
        // Check if server is ready
        if (output.includes('Server running on port') && !serverReady) {
          serverReady = true;
          logToFile('[Backend] ✓ Server is ready!');
          resolve();
        }
      });

      // Handle stderr
      backendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        logToFile('[Backend Error] ' + error.trim());
      });

      // Handle process exit
      backendProcess.on('exit', (code) => {
        logToFile('[Backend] Process exited with code: ' + code);
        if (code !== 0 && code !== null) {
          logToFile('[Backend] ✗ Backend server exited with error code: ' + code);
          reject(new Error(`Backend server exited with code ${code}`));
        }
      });
      
      // Handle spawn errors
      backendProcess.on('error', (error) => {
        logToFile('[Backend] ✗ Failed to spawn backend process: ' + error.message);
        reject(error);
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

// Handle second instance (focus existing window)
app.on('second-instance', () => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// App event handlers
app.whenReady().then(async () => {
  logToFile('========================================');
  logToFile('[App] App is ready, starting...');
  logToFile('[App] isDev: ' + isDev);
  logToFile('[App] isPackaged: ' + app.isPackaged);
  logToFile('[App] App path: ' + app.getAppPath());
  logToFile('========================================');
  
  // Create window first so user can see something
  createWindow();
  
  try {
    // Start backend server (don't block window creation)
    logToFile('[App] Starting backend server...');
    const backendPromise = startBackendServer();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Backend startup timeout')), 10000)
    );
    
    try {
      await Promise.race([backendPromise, timeoutPromise]);
      logToFile('[App] ✓ Backend server started successfully');
    } catch (error) {
      logToFile('[App] ✗ Backend startup error (continuing anyway): ' + error.message);
      logToFile('[App] Error stack: ' + (error.stack || 'No stack trace'));
      // Continue even if backend fails - window should still show
    }
    
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
    console.error('[App] Failed to start application:', error);
    // Don't quit - window should already be created
    // Just log the error
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

