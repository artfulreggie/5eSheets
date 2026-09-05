// ----------------------------------------------------------------------------
// frontmatter.mjs
//
// Check the syntax of markdown files wrt frontmatter.
//
// Two lists drive this, both optional. "required" names keys every file
// must carry; while it is non-empty a file with no frontmatter at all is
// an error. "forbidden" names keys that must not ship -- "id" is written
// by an ID plugin whenever this repo is opened as a vault, and would
// otherwise creep back in one file at a time.
//
// NOTE: This is **NOT** a YAML parser, m'kay. This is just checking flat kvp.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { walk } from '../lib/fsutil.mjs';


export const name = 'frontmatter';

function topLevelKeys(block) {
  const keys = [];
  for (const line of block.split('\n')) {
    if (/^\s/.test(line) ||
        line.trim() === '' ||
        line.trim().startsWith('#')) {
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (match) {
      keys.push(match[1]);
    }
  }
  return keys;
}

export function run(root, config) {
  const cfg = config.checks.frontmatter;
  const dir = join(root, cfg.dir);
  const required = cfg.required ?? [];
  const forbidden = cfg.forbidden ?? [];
  const problems = [];

  for (const rel of walk(dir, { skip: config.skipFiles, extensions: cfg.extensions })) {
    // NOTE:  `\r?` keeps this working if a CRLF file ever slips past .gitattributes
    // Pretty sneaky, sis.
    const text = readFileSync(join(dir, rel), 'utf8').replace(/^\uFEFF/, '');
    const match = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);

    if (!match) {
      // A file with no block has nothing to forbid, and is missing
      // nothing unless something was required of it.
      if (required.length) {
        problems.push(`${cfg.dir}/${rel}: no frontmatter block`);
      }
      continue;
    }

    const keys = topLevelKeys(match[1]);

    const missing = required.filter((k) => !keys.includes(k));
    if (missing.length) {
      problems.push(`${cfg.dir}/${rel}: missing key(s): ${missing.join(', ')}`);
    }

    const present = forbidden.filter((k) => keys.includes(k));
    if (present.length) {
      problems.push(
        `${cfg.dir}/${rel}: key(s) that must not ship: ${present.join(', ')}`
      );
    }
  }

  return problems;
}
