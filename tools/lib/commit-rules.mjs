// ----------------------------------------------------------------------------
// commit-rules.mjs
//
// Validation for commit messages.
//
// See: commit-msg-hook
//
// Copyright (c) 2026 Artfulreggie. All Rights Reserved.
// ----------------------------------------------------------------------------

const MERGE = /^Merge (branch|remote-tracking branch|pull request|tag) /;
const REVERT = /^Revert "/;
const FIXUP = /^(fixup|squash|amend)! /;

/**
 * Strip everything git would strip before storing the message: comment lines
 * and anything past the --verbose scissors line.
 *
 * `commentChar` is git's core.commentChar. It is '#' almost everywhere, but
 * a user who set it to something else would otherwise have their comments
 * validated as the header.
 */
export function cleanMessage(raw, commentChar = '#') {
  const scissors = raw.indexOf(
    `${commentChar} ------------------------ >8 ------------------------`,
  );

  const body = scissors === -1 ? raw : raw.slice(0, scissors);
  return body
    .split(/\r?\n/)
    .filter((line) => !line.startsWith(commentChar))
    .join('\n')
    .trim();
}

/**
 * Returns an array of problem strings.
 * Empty means the message is fine.
 */
export function validate(raw, cfg, commentChar = '#') {
  const message = cleanMessage(raw, commentChar);
  const problems = [];

  if (message === '') return ['empty commit message'];

  const lines = message.split('\n');
  const header = lines[0];

  // Ignore generated messages
  if (MERGE.test(header) || REVERT.test(header) || FIXUP.test(header)) return [];

  const match = header.match(/^([a-z]+)(\(([^)]+)\))?(!)?: (.+)$/);

  if (!match) {
    problems.push(
      `header must be "type(optional-scope): subject"\n    got: ${header}`,
    );

    return problems;
  }

  const [, type, , scope, , subject] = match;

  if (!cfg.types.includes(type)) {
    problems.push(`unknown type "${type}" (allowed: ${cfg.types.join(', ')})`);
  }

  if (cfg.allowedScopes && scope && !cfg.allowedScopes.includes(scope)) {
    problems.push(`unknown scope "${scope}" (allowed: ${cfg.allowedScopes.join(', ')})`);
  }

  if (header.length > cfg.maxHeaderLength) {
    problems.push(`header is ${header.length} chars, max ${cfg.maxHeaderLength}`);
  }

  if (subject.endsWith('.')) {
    problems.push('subject must not end with a period');
  }

  if (cfg.lowercaseSubject && /^[A-Z][a-z]/.test(subject)) {
    problems.push(`subject should not start capitalised: "${subject}"`);
  }

  if (lines.length > 1 && lines[1].trim() !== '') {
    problems.push('body must be separated from the header by a blank line');
  }

  if (cfg.maxBodyLineLength) {
    lines.slice(2).forEach((line, i) => {
      // URLs and code should not exceed the wrap width.
      if (line.length > cfg.maxBodyLineLength && !/^\s|https?:\/\//.test(line)) {
        problems.push(
          `body line ${i + 3} is ${line.length} chars, max ${cfg.maxBodyLineLength}`
        );
      }
    });
  }

  return problems;
}
