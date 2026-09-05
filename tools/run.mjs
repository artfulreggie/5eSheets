#!/usr/bin/env node
// Single entry point for every task. Including:
// - Git hooks
// - Makefile
// - CI
//
// Calls include:
//   node tools/run.mjs setup
//   node tools/run.mjs check
//   node tools/run.mjs install --vault=/path/to/vault
//   node tools/run.mjs pre-commit


import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';


const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repoRoot); // every task assumes cwd is the repo root

/**
 * The major version from .node-version. nvm and fnm write "v22.11.0"; a
 * bare "22" is equally valid. Number("v22") is NaN and every comparison
 * against NaN is false, which would switch the gate below off in silence.
 */
function requiredMajor() {
  let raw;

  try {
    raw = readFileSync('.node-version', 'utf8').trim();
  } catch {
    console.error('cannot read .node-version (is this a full checkout?)');
    process.exit(1);
  }

  const major = Number(raw.replace(/^v/, '').split('.')[0]);
  if (!Number.isInteger(major)) {
    console.error(`.node-version is not a version: ${raw}`);
    process.exit(1);
  }

  return major;
}

const required = requiredMajor();
const actual = Number(process.versions.node.split('.')[0]);

if (actual < required) {
  console.error(`node ${required} or newer required (found ${process.versions.node})`);
  process.exit(1);
}

const [name, ...args] = process.argv.slice(2);
const TASKS = ['setup', 'check', 'install', 'pre-commit', 'commit-msg', 'check-commits'];

if (!name || !TASKS.includes(name)) {
  console.error(`usage: node tools/run.mjs <${TASKS.join('|')}> [args]`);
  process.exit(2);
}

try {
  const mod = await import(`./tasks/${name}.mjs`);
  await mod.task(args);
} catch (err) {
  if (err instanceof Error && err.constructor === Error) {
    console.error(err.message);
  } else {
    console.error(err);
  }

  process.exit(1);
}
