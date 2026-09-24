import { readFile } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const adminHtml = await readFile('dist/commissioner.html', 'utf8');
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
  ['replay speed label', /id="replaySpeed"[^>]*aria-label="Replay speed"/],
  ['game heading can receive focus after setup', /id="greeting"[^>]*tabindex="-1"/],
  ['mobile navigation state', /id="mobileMenu"[^>]*aria-controls="sidebar"[^>]*aria-expanded="false"/],
  ['replay length label', /id="replayDuration"[^>]*aria-label="Replay length"/],
  ['season review dialog label', /<dialog id="seasonDialog"[^>]*aria-labelledby="seasonTitle"/],
  ['season statistics caption', /<caption>Player season statistics<\/caption>/],
  ['club picker label', /id="clubPicker"[^>]*aria-label="Available clubs"/],
  ['club preview status', /id="clubPreview"[^>]*aria-live="polite"/],
  ['guided tour label', /<dialog id="tourDialog"[^>]*aria-labelledby="tourTitle"[^>]*aria-describedby="tourText"/],
  ['captain decision label', /class="squad-decision"[^>]*aria-labelledby="captainLabel"/],
  ['captain status', /id="captainHelp"[^>]*role="status"[^>]*aria-live="polite"/],
  ['rotation advice status', /id="squadAdvice"[^>]*role="status"[^>]*aria-live="polite"[^>]*tabindex="-1"/],
  ['board confidence label', /id="boardConfidence"[^>]*aria-label="Board confidence"/],
  ['academy candidate group', /id="academyCandidates"[^>]*role="group"[^>]*aria-label="Academy prospects"/],
  ['academy selection status', /id="academyHelp"[^>]*role="status"[^>]*aria-live="polite"/]
];

const adminRequired = [
  ['commissioner language', /<html lang="[a-z-]+"/],
  ['commissioner main landmark', /<main id="commissionerApp"[^>]*aria-labelledby=/],
  ['commissioner status region', /id="phaseStatus"[^>]*role="status"[^>]*aria-live="polite"/],
  ['manager status table', /<table><caption class="sr-only">Manager action status/],
  ['commissioner action status', /id="actionStatus"[^>]*role="status"[^>]*aria-live="polite"/],
  ['audit list', /<ol id="auditEvents"/]
];

const missing = required.filter(([, pattern]) => !pattern.test(html)).map(([name]) => name);
if (missing.length) throw new Error(`Accessibility checks failed: ${missing.join(', ')}`);
const missingAdmin = adminRequired.filter(([, pattern]) => !pattern.test(adminHtml)).map(([name]) => name);
if (missingAdmin.length) throw new Error(`Commissioner accessibility checks failed: ${missingAdmin.join(', ')}`);
console.log(`Accessibility structure checks passed (${required.length + adminRequired.length}).`);
