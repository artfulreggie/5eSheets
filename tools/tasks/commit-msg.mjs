// ----------------------------------------------------------------------------
// commit-msg.mjs
//
// Validates commit messages.
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { loadConfig } from '../lib/fsutil.mjs';
import { validate } from '../lib/commit-rules.mjs';


/**
 * Which character git treats as starting a comment in this repo.
 *
 * core.commentChar can also be "auto", where git picks a character per
 * message from a candidate list. We cannot recover which it chose, so fall
 * back to the default and accept that the odd "auto" message keeps its
 * comment lines.
 */
function commentChar() {
  const r = spawnSync('git', ['config', '--get', 'core.commentChar'], {
    encoding: 'utf8',
  });

  const value = r.status === 0 ? r.stdout.trim() : '';
  return value.length === 1 ? value : '#';
}

export function task(args) {
  const file = args[0];

  if (!file) {
    console.error('commit-msg: no message file passed');
    process.exit(1);
  }

  const config = loadConfig('.');
  const problems = validate(
    readFileSync(file, 'utf8'), config.commitMsg, commentChar(),
  );

  if (problems.length === 0) return;

  console.error('\ncommit message rejected:\n');
  for (const p of problems) {
    console.error(`  - ${p}`);
  }
  console.error(`
  format: type(scope): subject

  examples:
    feat(templates): add weekly review template
    fix(scripts): guard against missing frontmatter
    docs: explain the install steps

  your message is kept; run \`git commit\` again to edit it.
`);
  process.exit(1);
}
