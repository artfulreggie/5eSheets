// ----------------------------------------------------------------------------
// script-refs.mjs
//
// Checks that templates are referencing JS that exist.
// Otherwise users will see the controls silently fail.
//
// NOTE: see `checks.scriptRefs.patterns` in config.json for matching.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { walk } from '../lib/fsutil.mjs';


export const name = 'script refs';

export function run(root, config) {
  const cfg = config.checks.scriptRefs;
  const templatesDir = join(root, cfg.templatesDir);
  const scriptsDir = join(root, cfg.scriptsDir);
  const problems = [];

  // Buttons locate their script beside the note that holds them, so a
  // reference is a bare filename. Comparing basenames also keeps a script
  // that moves into a subdirectory findable.
  const available = new Set(
    walk(scriptsDir, { skip: config.skipFiles })
      .map((rel) => rel.slice(rel.lastIndexOf('/') + 1)),
  );
  const patterns = cfg.patterns.map((p) => new RegExp(p, 'g'));

  let found = 0;

  for (const rel of walk(templatesDir, { skip: config.skipFiles, extensions: ['.md'] })) {
    const text = readFileSync(join(templatesDir, rel), 'utf8');

    for (const pattern of patterns) {
      pattern.lastIndex = 0; // /g regexes are stateful across .exec() calls
      let m;
      while ((m = pattern.exec(text)) !== null) {
        found += 1;
        if (!available.has(m[1])) {
          problems.push(`${cfg.templatesDir}/${rel}: references missing script "${m[1]}"`);
        }
      }
    }
  }

  if (cfg.minRefs && found < cfg.minRefs) {
    problems.push(
      `expected at least ${cfg.minRefs} script reference(s), found ${found}` +
      ' - has the button syntax changed?',
    );
  }

  return problems;
}
