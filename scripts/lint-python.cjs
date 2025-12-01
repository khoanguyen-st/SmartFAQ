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

// -------------------------------------------------------
// Auto-detect Conda environment or use CONDA_LINT=1 override
// -------------------------------------------------------
let condaRuff = null;
let condaBlack = null;

// Auto-detect if CONDA_PREFIX exists (user is in conda env)
if (process.env.CONDA_PREFIX) {
  const condaBin = path.join(
    process.env.CONDA_PREFIX,
    isWindows ? 'Scripts' : 'bin'
  );

  condaRuff = path.join(condaBin, isWindows ? 'ruff.exe' : 'ruff');
  condaBlack = path.join(condaBin, isWindows ? 'black.exe' : 'black');

  if (fs.existsSync(condaRuff) && fs.existsSync(condaBlack)) {
    console.log('✔ Using Conda environment for linting');
  } else {
    console.warn('⚠ Conda environment detected but ruff/black not found. Falling back to venv.');
    condaRuff = null;
    condaBlack = null;
  }
}

// -------------------------------------------------------
// Default venv paths (team standard)
// -------------------------------------------------------
const venvBinDir = isWindows
  ? path.join('apps', 'api', 'venv', 'Scripts')
  : path.join('apps', 'api', 'venv', 'bin');

const ruffPath = condaRuff || path.join(venvBinDir, isWindows ? 'ruff.exe' : 'ruff');
const blackPath = condaBlack || path.join(venvBinDir, isWindows ? 'black.exe' : 'black');

// Check if venv exists (only when not using conda)
if (!condaRuff && !fs.existsSync(venvBinDir)) {
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
    execSync(`"${ruffPath}" check --fix ${files.join(' ')}`, {
      stdio: 'inherit',
      shell: true
    });
  }

  if (command === 'black' || command === 'both') {
    console.log('Running black...');
    execSync(`"${blackPath}" ${files.join(' ')}`, {
      stdio: 'inherit',
      shell: true
    });
  }
} catch (error) {
  process.exit(error.status || 1);
}
