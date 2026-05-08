const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const electronBuilderCli = path.join(
  rootDir,
  'node_modules',
  'electron-builder',
  'cli.js',
);

const cacheRoot = path.join(rootDir, '.cache');
const env = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY || 'false',
  ELECTRON_CACHE: process.env.ELECTRON_CACHE || path.join(cacheRoot, 'electron'),
  ELECTRON_BUILDER_CACHE: process.env.ELECTRON_BUILDER_CACHE || path.join(cacheRoot, 'electron-builder'),
};

fs.mkdirSync(env.ELECTRON_CACHE, { recursive: true });
fs.mkdirSync(env.ELECTRON_BUILDER_CACHE, { recursive: true });

const result = spawnSync(
  process.execPath,
  [electronBuilderCli, '--win', '--x64', '--publish', 'never'],
  {
    cwd: rootDir,
    env,
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
