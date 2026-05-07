const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

let mainWindow = null;
let serverProcess = null;

const START_PORT = 32123;
const SERVER_TIMEOUT_MS = 30000;

const isPackaged = app.isPackaged;

const getProjectRoot = () => {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked');
  }

  return app.getAppPath();
};

const getServerPath = () => {
  return path.join(getProjectRoot(), '.next', 'standalone', 'server.js');
};

const getBundledDataPath = () => {
  return path.join(getProjectRoot(), 'data');
};

const copyInitialDataIfNeeded = () => {
  const source = getBundledDataPath();
  const target = path.join(app.getPath('userData'), 'data');

  if (fs.existsSync(target)) {
    return target;
  }

  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { recursive: true });
  } else {
    fs.mkdirSync(target, { recursive: true });
  }

  return target;
};

const findFreePort = (startPort) => new Promise((resolve, reject) => {
  const tryPort = (port) => {
    const server = net.createServer();

    server.once('error', error => {
      if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
        tryPort(port + 1);
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolve(port));
    });

    server.listen(port, '127.0.0.1');
  };

  tryPort(startPort);
});

const waitForServer = (url) => new Promise((resolve, reject) => {
  const deadline = Date.now() + SERVER_TIMEOUT_MS;

  const check = () => {
    const request = http.get(url, response => {
      response.resume();
      resolve();
    });

    request.on('error', () => {
      if (Date.now() > deadline) {
        reject(new Error(`CoursePilot did not start within ${SERVER_TIMEOUT_MS / 1000}s.`));
        return;
      }

      setTimeout(check, 300);
    });

    request.setTimeout(1000, () => {
      request.destroy();
    });
  };

  check();
});

const stopServer = () => {
  if (!serverProcess || serverProcess.killed) return;

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
  } else {
    serverProcess.kill('SIGTERM');
  }

  serverProcess = null;
};

const startServer = async () => {
  const serverPath = getServerPath();
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Next standalone server not found: ${serverPath}`);
  }

  const port = await findFreePort(START_PORT);
  const dataDir = copyInitialDataIfNeeded();

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      COURSEPILOT_DATA_DIR: dataDir,
      ELECTRON_RUN_AS_NODE: '1',
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: String(port),
    },
    stdio: 'ignore',
    windowsHide: true,
  });

  serverProcess.once('exit', code => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox('CoursePilot wurde beendet', `Der lokale App-Server wurde beendet. Exit-Code: ${code ?? 'unbekannt'}`);
      mainWindow.close();
    }
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  return url;
};

const createWindow = async () => {
  const url = await startServer();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 950,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    title: 'CoursePilot',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(url);
};

app.whenReady().then(createWindow).catch(error => {
  dialog.showErrorBox('CoursePilot konnte nicht starten', error.message);
  app.quit();
});

app.on('before-quit', stopServer);

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(error => {
      dialog.showErrorBox('CoursePilot konnte nicht starten', error.message);
    });
  }
});
