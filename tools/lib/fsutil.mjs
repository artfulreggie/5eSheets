// ----------------------------------------------------------------------------
// fsutil.mjs
//
// File system utilities for POSIX and non-POSIX systems alike.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { readdirSync, readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';


/**
 * Parse a JSON file, saying which one when it will not parse.
 */
function readJson(path) {
  let text;

  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    throw new Error(`cannot read ${path}: ${err.message}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${path} is not valid JSON: ${err.message}`);
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Layer `overlay` onto `base`, recursing into plain objects.
 */
function merge(base, overlay) {
  const out = { ...base };

  for (const [key, value] of Object.entries(overlay)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key])
      ? merge(base[key], value)
      : value;
  }

  return out;
}

/**
 * The project config, with config.local.json layered over config.json.
 *
 * The local file is gitignored and optional. It is where settings that
 * differ from one person to the next belong, a vault path (if y'nasty)
 */
export function loadConfig(root = '.') {
  const base = readJson(join(root, 'config.json'));
  const local = join(root, 'config.local.json');

  if (!existsSync(local)) {
    return base;
  }

  const overlay = readJson(local);

  if (!isPlainObject(overlay)) {
    throw new Error(`${local} must hold a JSON object`);
  }

  return merge(base, overlay);
}

/**
 * List every file under `dir`, recursively, as paths relative to `dir`.
 * Always uses forward slashes so results compare identically on Windows.
 *
 * Throws when `dir` is missing. A check aimed at a directory that moved
 * should fail loudly, not report success over nothing.
 */
export function walk(dir, { skip = [], extensions = null } = {}) {
  if (!existsSync(dir)) {
    throw new Error(`no such directory: ${dir}`);
  }

  const out = [];

  const recurse = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (skip.includes(entry.name)) {
        continue;
      }

      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        recurse(full);
      } else if (entry.isFile()) {
        if (extensions && !extensions.includes(extname(entry.name))) {
          continue;
        }

        out.push(relative(dir, full).split(sep).join('/'));
      }
    }
  };

  recurse(dir);
  return out.sort();
}

/**
 * Copy a directory tree.
 *
 * (Because Windows knows not of rsync / fs.cpSync)
 *
 * Note: symlinks are skipped on purpose. (See walk above.)
 * Also, also: we never want to follow a link while writing into someone's
 * vault.
 */
export function copyDir(src, dest, { skip = [] } = {}) {
  mkdirSync(dest, { recursive: true });
  let count = 0;

  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (skip.includes(entry.name)) {
      continue;
    }

    const from = join(src, entry.name);
    const to = join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDir(from, to, { skip });
    } else if (entry.isFile()) {
      copyFileSync(from, to); count += 1;
    }
  }

  return count;
}
