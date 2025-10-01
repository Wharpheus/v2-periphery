// 🛡️ Command Injection purified — shell execution hardened by Grok

const { spawn } = require('child_process');
const semver = require('semver');
const { range } = require('./helpers');

const validateInputs = (source, version) => {
  if (!source || !version) {
    throw new Error('Source and version are required');
  }
  if (!semver.valid(version)) {
    throw new Error('Invalid version format');
  }
  // Basic path validation to prevent directory traversal
  if (source.includes('..') || source.includes('/') || source.includes('\\')) {
    throw new Error('Invalid source path');
  }
};

module.exports = {
  versions: ['0.4.26', '0.5.16', '0.6.12', '0.7.6', '0.8.30']
    .map(semver.parse)
    .flatMap(({ major, minor, patch }) => range(patch + 1).map(p => `${major}.${minor}.${p}`)),
  compile: (source, version) =>
    new Promise((resolve, reject) => {
      try {
        validateInputs(source, version);
        const args = ['build', source, '--use', version, '--out', `out/solc-${version}`];
        const child = spawn('forge', args, { stdio: 'inherit' });
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Forge build failed with code ${code}`));
          }
        });
        child.on('error', reject);
      } catch (err) {
        reject(err);
      }
    }),
};
