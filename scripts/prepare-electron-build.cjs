const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const nextDir = path.join(rootDir, '.next');
const standaloneDir = path.join(nextDir, 'standalone');
const serverFile = path.join(standaloneDir, 'server.js');
const staticSource = path.join(nextDir, 'static');
const staticTarget = path.join(standaloneDir, '.next', 'static');
const publicSource = path.join(rootDir, 'public');
const publicTarget = path.join(standaloneDir, 'public');
const dataDir = path.join(rootDir, 'data');

const copyDirectory = (source, target, required = false) => {
  if (!fs.existsSync(source)) {
    if (required) {
      throw new Error(`Required build directory is missing: ${source}`);
    }

    return false;
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
  return true;
};

if (!fs.existsSync(serverFile)) {
  throw new Error(`Next standalone server not found: ${serverFile}. Run npm run build first.`);
}

if (!fs.existsSync(dataDir)) {
  throw new Error(`Application data directory not found: ${dataDir}`);
}

copyDirectory(staticSource, staticTarget, true);
copyDirectory(publicSource, publicTarget);

console.log('Prepared Next standalone output for Electron packaging.');
