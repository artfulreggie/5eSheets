// ----------------------------------------------------------------------------
// install.mjs
//
// Installs by copying src/ into an Obsidian vault.
//
// No need to build the project, src is all good to go.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { loadConfig, copyDir, walk } from '../lib/fsutil.mjs';
import { runChecks } from './check.mjs';


const FLAG = '--vault=';

/**
 * Expand a leading "~".
 *
 * See expandVars above for why a config file needs this done for it.
 *
 * NOTE:
 * Tilde is a shell feature, and zsh does not apply it after "=" in a
 * command argument, so `make install VAULT=~/vault` hands us the
 * character itself and resolve() reads it as a directory named "~" under
 * the cwd. bash expands it first, which is why this only bites some
 * shells. It never reaches a shell at all when it comes from vaultDir.
 */
function expandVars(value) {
  return value.replace(
    /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g,
    (match, braced, bare) => {
      const found = process.env[braced ?? bare];

      if (found === undefined) {
        throw new Error(`${match} is not set in the environment`);
      }

      return found;
    },
  );
}

function expandHome(value) {
  if (value === '~') {
    return homedir();
  }

  if (value.startsWith('~/') || value.startsWith('~\\')) {
    return join(homedir(), value.slice(2));
  }

  return value;
}

/**
 * The vault, from the most specific source that names one.
 *
 * An empty `--vault=` counts as absent: `make install` sends the flag
 * whether or not VAULT was set, and it would otherwise mask the
 * settings behind it.
 */
function findVault(args, config) {
  const flag = args.find((a) => a.startsWith(FLAG));
  const candidates = [
    flag && flag.slice(FLAG.length),
    process.env.VAULT,
    config.install.vaultDir,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return expandHome(expandVars(value.trim()));
    }
  }

  return null;
}

/**
 * Why `subdir` may not be used, or null when it is fine.
 *
 * Mirrors the guard in src/setup.js with the holes closed that only
 * matter off Obsidian: Windows separators and drive letters, and hidden
 * directories anywhere in the path rather than only at the front. We are
 * writing into somebody's notes; ".obsidian" is not ours to touch.
 */
function subdirProblem(subdir) {
  if (typeof subdir !== 'string' || !subdir.trim()) {
    return 'install.vaultSubdir is empty';
  }

  if (/^([/\\]|[A-Za-z]:)/.test(subdir)) {
    return `install.vaultSubdir must be vault-relative: ${subdir}`;
  }

  if (subdir.startsWith('~')) {
    return `install.vaultSubdir sits inside the vault, so "~" means nothing`
      + ` there: ${subdir}`;
  }

  for (const segment of subdir.split(/[/\\]/)) {
    if (segment === '' || segment === '.' || segment === '..') {
      return `install.vaultSubdir has an empty or dotted segment: ${subdir}`;
    }

    if (segment.startsWith('.')) {
      return `install.vaultSubdir may not name a hidden directory: ${segment}`;
    }
  }

  return null;
}

/**
 * Files already in `dest` that `src` no longer ships.
 *
 * copyDir only ever adds, so a file renamed or dropped from src/ stays in
 * the vault for good. We do not remove them - this is somebody's notes
 * directory and we did not put everything here - but saying nothing is how
 * you end up with two Setup notes and no idea which one the button runs.
 */
function staleFiles(sourceDir, dest, skip) {
  if (!existsSync(dest)) {
    return [];
  }

  const shipped = new Set(walk(sourceDir, { skip }));
  return walk(dest, { skip }).filter((rel) => !shipped.has(rel));
}

function reportStale(stale) {
  if (stale.length === 0) {
    return;
  }

  console.log(`\n${stale.length} file(s) already there that src/ no longer`
    + ' ships, left untouched:');

  for (const file of stale) {
    console.log(`  ${file}`);
  }
}

/**
 * Say what an install would do without doing it.
 *
 * Writing into somebody's notes deserves a way to look first, and which
 * files already exist is the part worth seeing.
 */
function report(sourceDir, dest, skip) {
  const files = walk(sourceDir, { skip });

  console.log(`\nwould install ${files.length} file(s) to ${resolve(dest)}`);

  for (const file of files) {
    const verb = existsSync(join(dest, file)) ? 'overwrite' : 'create';
    console.log(`  ${verb.padEnd(9)} ${file}`);
  }

  reportStale(staleFiles(sourceDir, dest, skip));
}

export function task(args) {
  const config = loadConfig('.');
  const vault = findVault(args, config);

  if (!vault) {
    console.error(
      'no vault given. Pass --vault=/path/to/vault, set VAULT in the'
      + ' environment,\nor fill in install.vaultDir in config.local.json',
    );

    process.exit(1);
  }

  // Refuse anything that is not obviously a vault. We are writing into a
  // directory full of somebody's notes. So fail loud and fail proud, big guy.
  //
  if (!existsSync(join(vault, '.obsidian'))) {
    console.error(`not an Obsidian vault (no .obsidian/): ${resolve(vault)}`);
    process.exit(1);
  }

  console.log('checking before install');
  if (!runChecks('.')) {
    console.error('\ninstall aborted: checks failed');
    process.exit(1);
  }

  // Expand before guarding, never after: a variable holding ".." would
  // otherwise walk straight past these rules.
  const subdir = typeof config.install.vaultSubdir === 'string'
    ? expandVars(config.install.vaultSubdir)
    : config.install.vaultSubdir;

  const problem = subdirProblem(subdir);

  if (problem) {
    console.error(problem);
    process.exit(1);
  }

  // Belt and braces: whatever the segment rules let through still has to
  // land inside the vault.
  const dest = join(vault, subdir);
  const root = resolve(vault);

  if (!resolve(dest).startsWith(root + sep)) {
    console.error(`install would write outside the vault: ${resolve(dest)}`);
    process.exit(1);
  }

  if (args.includes('--dry-run')) {
    report(config.install.sourceDir, dest, config.skipFiles);
    return;
  }

  const stale = staleFiles(config.install.sourceDir, dest, config.skipFiles);
  const n = copyDir(config.install.sourceDir, dest, { skip: config.skipFiles });

  console.log(`\ninstalled ${n} file(s) to ${resolve(dest)}`);
  reportStale(stale);
}
