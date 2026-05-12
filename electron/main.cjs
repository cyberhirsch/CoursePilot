const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

let mainWindow = null;
let serverProcess = null;

const START_PORT = 32123;
const SERVER_TIMEOUT_MS = 30000;
const EMPTY_DATA_FILES = {
  'academic-calendar.json': {
    academicYearStartMonth: 10,
    semesters: [],
  },
  'catalogs.json': {
    examTypes: [],
    teachingMethods: [],
    languages: [],
    personInCharge: [],
  },
  'categories.json': [],
  'cohorts.json': [],
  'lecturer-availability.json': [],
  'modules.json': [],
  'programs.json': [],
  'room-occupancy.json': [],
  'rooms.json': [],
  'schedule.json': null,
  'system-settings.json': {},
  'users.json': [],
};

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

const getPublicAssetPath = (fileName) => {
  if (isPackaged) {
    return path.join(getProjectRoot(), '.next', 'standalone', 'public', fileName);
  }

  return path.join(getProjectRoot(), 'public', fileName);
};

const getWindowIconPath = () => {
  const iconPath = getPublicAssetPath('favicon.ico');
  return fs.existsSync(iconPath) ? iconPath : undefined;
};

const getSplashUrl = () => {
  const logoPath = getPublicAssetPath('logo.png');
  const logoSrc = fs.existsSync(logoPath)
    ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    : '';
  const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CoursePilot</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      background: #1f1f1f;
      color: #f7f7f8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 50% 40%, rgba(74, 93, 204, 0.16), transparent 34rem),
        #1f1f1f;
      overflow: hidden;
    }
    .splash {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      text-align: center;
      transform: translateY(-1rem);
    }
    .logo {
      width: min(11rem, 30vw);
      height: min(11rem, 30vw);
      object-fit: contain;
      filter: drop-shadow(0 1.5rem 3rem rgba(0, 0, 0, 0.42));
    }
    .title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 750;
      letter-spacing: 0;
    }
    .status {
      color: #a8adb8;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .copyright {
      color: #737885;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .dots {
      display: inline-flex;
      gap: 0.32rem;
      margin-left: 0.2rem;
      vertical-align: middle;
    }
    .dots span {
      width: 0.34rem;
      height: 0.34rem;
      border-radius: 999px;
      background: #59d7e5;
      animation: pulse 1s ease-in-out infinite;
    }
    .dots span:nth-child(2) { animation-delay: 0.15s; }
    .dots span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-0.22rem); }
    }
  </style>
</head>
<body>
  <main class="splash" aria-live="polite">
    ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="" />` : ''}
    <h1 class="title">CoursePilot</h1>
    <div class="status">App wird gestartet<span class="dots"><span></span><span></span><span></span></span></div>
    <div class="copyright">Copyright (c) 2026 Seb Hirsch</div>
  </main>
</body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
};

const getWritableDataPath = () => {
  if (isPackaged && process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data');
  }

  return path.join(app.getPath('userData'), 'data');
};

const ensureEmptyDataFiles = (target) => {
  fs.mkdirSync(target, { recursive: true });

  Object.entries(EMPTY_DATA_FILES).forEach(([fileName, value]) => {
    const filePath = path.join(target, fileName);
    if (fs.existsSync(filePath)) return;

    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
  });
};

const copyInitialDataIfNeeded = () => {
  const source = getBundledDataPath();
  const target = getWritableDataPath();

  if (isPackaged) {
    ensureEmptyDataFiles(target);
    return target;
  }

  if (fs.existsSync(target)) {
    ensureEmptyDataFiles(target);
    return target;
  }

  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { recursive: true });
  } else {
    ensureEmptyDataFiles(target);
  }

  ensureEmptyDataFiles(target);
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
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 950,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#1f1f1f',
    autoHideMenuBar: true,
    icon: getWindowIconPath(),
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

  await mainWindow.loadURL(getSplashUrl());
  const url = await startServer();
  await mainWindow.loadURL(url);
};

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  return createWindow();
}).catch(error => {
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
