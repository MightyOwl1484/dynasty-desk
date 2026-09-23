import { readFile } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const required = [
  ['document language', /<html lang="[a-z-]+"/],
  ['responsive viewport', /name="viewport"/],
  ['game landmark', /<main id="game"[^>]*aria-labelledby=/],
  ['named game navigation', /<nav aria-label="Game sections"/],
  ['result dialog label', /<dialog id="resultDialog"[^>]*aria-labelledby=/],
  ['replay dialog label', /<dialog id="replayDialog"[^>]*aria-labelledby=/],
  ['result event log', /id="commentary"[^>]*role="log"[^>]*aria-live="polite"/],
  ['replay status', /id="replayStatus"[^>]*role="status"[^>]*aria-live="polite"/],
  ['tactic guidance', /id="tacticHelp"[^>]*role="status"[^>]*aria-live="polite"/],
  ['backup import type', /id="importFile"[^>]*type="file"[^>]*accept="application\/json/],
  ['replay speed label', /id="replaySpeed"[^>]*aria-label="Replay speed"/]
];

const missing = required.filter(([, pattern]) => !pattern.test(html)).map(([name]) => name);
if (missing.length) throw new Error(`Accessibility checks failed: ${missing.join(', ')}`);
console.log(`Accessibility structure checks passed (${required.length}).`);
