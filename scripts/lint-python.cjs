#!/usr/bin/env node

/**
 * Cross-platform Python linter wrapper for lint-staged
 * Automatically detects OS and uses correct venv path
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Detect platform
const isWindows = process.platform === 'win32';

// Venv paths
const venvBinDir = isWindows 
  ? path.join('apps', 'api', 'venv', 'Scripts')
  : path.join('apps', 'api', 'venv', 'bin');

const ruffPath = path.join(venvBinDir, isWindows ? 'ruff.exe' : 'ruff');
const blackPath = path.join(venvBinDir, isWindows ? 'black.exe' : 'black');

// Check if venv exists
if (!fs.existsSync(venvBinDir)) {
  console.error('❌ Python venv not found at:', venvBinDir);
  console.error('   Please run: cd apps/api && python -m venv venv && pip install -e ".[dev]"');
  process.exit(1);
}

// Get files from command line args
const files = process.argv.slice(2);

if (files.length === 0) {
  process.exit(0);
}

// Get command from env (set by lint-staged)
const command = process.env.LINT_COMMAND || 'both';

try {
  if (command === 'ruff' || command === 'both') {
    console.log('Running ruff...');
    const quotedFiles = files.map(f => `"${f}"`).join(' ');
    execSync(`"${ruffPath}" check --fix ${quotedFiles}`, { 
      stdio: 'inherit',
      shell: true 
    });
  }
  
  if (command === 'black' || command === 'both') {
    console.log('Running black...');
    const quotedFiles = files.map(f => `"${f}"`).join(' ');
    execSync(`"${blackPath}" ${quotedFiles}`, { 
      stdio: 'inherit',
      shell: true 
    });
  }
} catch (error) {
  process.exit(error.status || 1);
}
