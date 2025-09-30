// vscode-shim.test.js — verifies that the vscode shim works in Node/CI
import assert from 'assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __FILENAME = fileURLToPath(import.meta.url);
const __DIRNAME = path.dirname(__FILENAME);
const require = createRequire(import.meta.url);

// Import the shim (CommonJS) via require()
const vscode = require(path.join(__DIRNAME, 'vscode'));

describe('VSCode shim', () => {
  it('creates an enhanced terminal and runs a simple command', async () => {
    const term = vscode.window.createTerminal({ name: 'Shim Test', cwd: process.cwd() });
    assert(term, 'terminal should be created');

    // Use the global terminal manager to run a command
    const mgr = global.standaloneTerminalManager;
    const terminals = mgr.registry.getAllTerminals();
    assert(terminals.length > 0, 'should track created terminal');

    const tinfo = terminals[terminals.length - 1];
    const proc = mgr.runCommand(tinfo, process.platform === 'win32' ? 'echo hello' : 'printf hello');

    // Wait for completion
    await proc;

    const out = mgr.getUnretrievedOutput(tinfo.id);
    assert(/hello/.test(out), 'expected output from terminal process');
  });

  it('provides window messaging stubs', async () => {
    await vscode.window.showInformationMessage('shim info');
    await vscode.window.showWarningMessage('shim warn');
    await vscode.window.showErrorMessage('shim error');
  });
});
