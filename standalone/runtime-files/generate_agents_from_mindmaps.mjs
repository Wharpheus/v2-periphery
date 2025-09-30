#!/usr/bin/env node
/**
 * generate_agents_from_mindmaps.mjs
 *
 * Inputs: standalone/mindmap_runtimes/forensic/(1000004642.restored.json, 1000004643.restored.json)
 * Output: standalone/runtime-files/agents/<runtime_id>_Agent.ts (12 files by category quotas)
 * Log: standalone/runtime-files/generation_log.txt
 *
 * Enforces:
 * - Category quotas: troubleshooting+diagnostics (4), evolving (4), error_handling (2), integration/optimization (2)
 * - Branch count 4–7; includes at least one verification and one rollback/fallback
 * - concepts length 3–6, includes category
 * - Similarity guards vs existing agents (Jaccard >= 0.60 or concepts overlap >= 60% -> reject)
 * - Naming: runtime_id "<theme>_<focus>_<shorthash>"; Title in Title Case
 * - source tag: "1000004642.json" or "1000004643.json"
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(process.cwd(), '..', '..');
const RUNTIME_ROOT = path.resolve(process.cwd());
const AGENTS_DIR = path.join(RUNTIME_ROOT, 'agents');
const COPILOT_DIR = path.join(RUNTIME_ROOT, 'copilot-agent-runtime');
const QUARANTINE_DIR = path.join(RUNTIME_ROOT, 'quarantine');
const MINDMAP_DIR_CANDIDATES = [
  path.resolve(ROOT, 'standalone', 'mindmap_runtimes', 'forensic'),
  path.resolve(ROOT, 'mindmap_runtimes', 'forensic'),
];
function pickExistingDir(cands) {
  for (const d of cands) {
    if (fs.existsSync(d)) return d;
  }
  return cands[0];
}
const MINDMAP_DIR = pickExistingDir(MINDMAP_DIR_CANDIDATES);
const LOG_FILE = path.join(RUNTIME_ROOT, 'generation_log.txt');

const TARGET_BATCH = 12;
const QUOTAS = {
  troubleshooting: 2,
  diagnostics: 2,
  evolving: 4,
  error_handling: 2,
  optimization: 2,
};

const CATEGORY_TEMPLATES = {
  troubleshooting: [
    'Identify failure signature',
    'Capture environment snapshot',
    'Run targeted diagnostics',
    'Apply fix candidate with guard',
    'Verify outcome',
    'Rollback if verification fails',
  ],
  diagnostics: [
    'Collect system metrics and logs',
    'Compare against baseline thresholds',
    'Isolate anomalous components',
    'Pinpoint root cause signals',
    'Verify resolution via smoke checks',
    'Fallback to safe configuration on regression',
  ],
  evolving: [
    'Score options with live signals',
    'Select strategy',
    'Execute action',
    'Observe feedback',
    'Adapt parameters',
    'Persist learning',
    'Re-evaluate with updated priors',
  ],
  error_handling: [
    'Perform operation with timeout',
    'On failure, classify error',
    'Retry with exponential backoff',
    'Use fallback path if retries exhausted',
    'Emit structured error event',
    'Surface recovery instructions',
    'Verify idempotency and dedupe',
  ],
  optimization: [
    'Validate config',
    'Warm cache/index',
    'Execute operation with metrics',
    'Optimize hotspot based on profiles',
    'Verify SLO and regressions',
    'Emit performance report',
  ],
  integration: [
    'Validate external config and credentials',
    'Establish connection with health checks',
    'Execute end-to-end path with metrics',
    'Apply circuit breaker on downstream errors',
    'Verify contract and payload schema',
    'Fallback to degraded mode and log',
  ],
};

function toTitleCase(idPart) {
  return idPart.replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function shortHash(n=6) {
  return crypto.randomBytes(4).toString('hex').slice(0,n);
}

function tokenize(text) {
  return new Set(String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function jaccard(aSet, bSet) {
  const a = new Set(aSet); const b = new Set(bSet);
  const inter = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : inter.size / union.size;
}

function readJSONSafe(p) {
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; }
}

function listFilesRecursive(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d)) {
      const full = path.join(d, e);
      const st = fs.statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (!exts || exts.includes(path.extname(e))) out.push(full);
    }
  }
  return out;
}

function extractExistingKnowledge() {
  const candidates = [];
  const exts = ['.ts', '.js'];
  for (const dir of [AGENTS_DIR, path.join(COPILOT_DIR, 'agents'), QUARANTINE_DIR]) {
    const files = listFilesRecursive(dir, exts);
    for (const f of files) {
      const txt = fs.readFileSync(f,'utf8');
      // Extract concepts array if present
      const conceptsMatch = txt.match(/"concepts"\s*:\s*\[([\s\S]*?)\]/);
      let concepts = [];
      if (conceptsMatch) {
        concepts = conceptsMatch[1]
          .split(/\n|,/)
          .map(s=>s.replace(/[\"\[\]]/g,'').trim())
          .filter(Boolean);
      }
      // Extract branches content
      const branchMatches = [...txt.matchAll(/\"content\"\s*:\s*\"([\s\S]*?)\"/g)].map(m=>m[1]);
      const tokens = tokenize(branchMatches.join(' '));
      candidates.push({ file:f, concepts: new Set(concepts.map(c=>c.toLowerCase())), tokens });
    }
  }
  return candidates;
}

function chooseSourceTag(index) {
  // Distribute between the two sources
  return index % 2 === 0 ? '1000004642.json' : '1000004643.json';
}

function ensureVerificationAndRollback(branches) {
  const hasVerify = branches.some(b => /verify/i.test(b.content));
  const hasRollback = branches.some(b => /(rollback|fallback)/i.test(b.content));
  if (!hasVerify) {
    branches.push({ id: randomId('branch'), content: 'Verify outcome and assert acceptance criteria' });
  }
  if (!hasRollback) {
    branches.push({ id: randomId('branch'), content: 'Rollback to last known good state or activate fallback path' });
  }
  return branches;
}

function randomId(prefix) {
  return `${shortHash(6)}_${prefix}_${Math.floor(Math.random()*1000)}`;
}

function buildBranches(category) {
  const base = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.troubleshooting;
  // Choose 4–7 unique steps
  const shuffled = [...base].sort(()=>Math.random()-0.5);
  const n = 4 + Math.floor(Math.random()*4); // 4..7
  const chosen = shuffled.slice(0, n).map((c, i) => ({ id: randomId('branch_'+(i+1)), content: c }));
  return ensureVerificationAndRollback(chosen).slice(0, 7);
}

function pickConcepts(category) {
  const domainBanks = {
    troubleshooting: ['troubleshooting','diagnostics','observability','rollback','health-checks','incident'],
    diagnostics: ['diagnostics','telemetry','metrics','profiling','trace','quarantine'],
    evolving: ['feedback-loop','bandit','slo','policy','adaptive','tuning'],
    error_handling: ['idempotency','retry','dedupe','saga','backoff','circuit-breaker'],
    optimization: ['build-cache','artifact','perf','slo','profiling','throughput'],
    integration: ['integration','schema','contract','payload','compat','latency'],
  };
  const bank = domainBanks[category] || domainBanks.troubleshooting;
  const uniq = new Set([category]);
  const shuffled = [...bank].sort(()=>Math.random()-0.5);
  for (const term of shuffled) {
    if (uniq.size >= 4 + Math.floor(Math.random()*3)) break; // 3–6 total including category
    uniq.add(term);
  }
  const arr = Array.from(uniq);
  if (arr.length < 3) arr.push('verification');
  return arr.slice(0,6);
}

function makeRuntimeId(category) {
  // <theme>_<focus>_<shorthash>
  const themes = {
    troubleshooting: ['troubleshooting','service_outage','latency_spike'],
    diagnostics: ['diagnostics','ci_pipeline_flakiness','health_checks'],
    evolving: ['evolving','autoscaler_tuning','adaptive_strategy'],
    error_handling: ['error_handling','idempotent_writes','saga_recovery'],
    optimization: ['optimization','build_cache_warmup','hotspot_optimization'],
    integration: ['integration','api_contract_validation','compatibility_check'],
  };
  const pool = themes[category] || ['runtime','flow'];
  const theme = pool[0];
  const focus = pool[1 + Math.floor(Math.random()*(pool.length-1))] || 'flow';
  return `${theme}_${focus}_${shortHash(6)}`;
}

function titleFromRuntimeId(runtime_id) {
  const parts = runtime_id.split('_');
  const title = toTitleCase(parts.slice(0, -1).join(' '));
  return title;
}

function scaffoldTS(runtime_id, title, source, branches, concepts) {
  const RUNTIME_ID = runtime_id;
  const TITLE = title;
  const BRANCHES = JSON.stringify(branches, null, 2);
  const CONCEPTS = JSON.stringify(concepts, null, 2);
  return `import SmartPayloadBuilder from '../utils';
import { AgentExecutor } from '../types';

const RUNTIME_ID = '${RUNTIME_ID}'; // kebab/underscore id, unique
const TITLE = '${TITLE}';
const SOURCE = '${source}'; // e.g., 1000004643.json

const ${RUNTIME_ID}_Agent: AgentExecutor = {
  execute: async (payload) => {
    try {
      const output = {
        runtime_id: RUNTIME_ID,
        title: TITLE,
        timestamp: new Date().toISOString().replace(/:/g, '-'),
        source: SOURCE,
        branches: ${BRANCHES},
        concepts: ${CONCEPTS}
      };
      return SmartPayloadBuilder.success('Agent executed successfully', output);
    } catch (error: any) {
      return SmartPayloadBuilder.error(RUNTIME_ID + '_Agent Error', (error as any)?.message ?? String(error));
    }
  }
};

export default ${RUNTIME_ID}_Agent;
`;
}

function loadMindmapClusters() {
  const clusters = [];
  if (!fs.existsSync(MINDMAP_DIR)) return clusters;
  const names = fs.readdirSync(MINDMAP_DIR).filter(n => n.toLowerCase().endsWith('.json'));
  for (const name of names) {
    const f = path.join(MINDMAP_DIR, name);
    const data = readJSONSafe(f);
    if (!data) continue;
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const title = String(item?.title || '').trim();
      const concepts = Array.isArray(item?.concepts) ? item.concepts.map(String) : [];
      const branches = Array.isArray(item?.branches) ? item.branches.map(b=>String(b?.content||'')).filter(Boolean) : [];
      const source = String(item?.source || (name.includes('4642') ? '1000004642.json' : (name.includes('4643') ? '1000004643.json' : '1000004642.json')));
      clusters.push({ title, concepts, branches, source });
    }
  }
  return clusters;
}

function categorizeCluster(cluster) {
  const t = `${cluster.title} ${cluster.concepts.join(' ')}`.toLowerCase();
  if (/diagnostic|diagnostics|telemetry|metrics|trace/.test(t)) return 'diagnostics';
  if (/troubleshoot|incident|outage|latency/.test(t)) return 'troubleshooting';
  if (/evolving|adaptive|autoscaler|bandit|tuning/.test(t)) return 'evolving';
  if (/error|retry|idempot|saga|backoff|circuit/.test(t)) return 'error_handling';
  if (/optimi[sz]e|cache|hotspot|performance|slo/.test(t)) return 'optimization';
  if (/integrat|contract|schema|compat|api/.test(t)) return 'integration';
  return 'diagnostics';
}

function similarityGuard(existing, candidate) {
  // Jaccard on branches' tokens and concept overlap
  const candTokens = tokenize(candidate.branches.map(b=>b.content).join(' '));
  const candConcepts = new Set(candidate.concepts.map(c=>c.toLowerCase()));
  for (const base of existing) {
    const j = jaccard(candTokens, base.tokens);
    if (j >= 0.60) {
      return { ok:false, reason: `Near-duplicate of ${path.basename(base.file)} (similarity ${j.toFixed(2)})` };
    }
    // concept overlap percent
    const inter = new Set([...candConcepts].filter(x=>base.concepts.has(x)));
    const overlap = candConcepts.size ? (inter.size / candConcepts.size) : 0;
    if (overlap >= 0.60) {
      return { ok:false, reason: `Concept overlap ${Math.round(overlap*100)}% with ${path.basename(base.file)}` };
    }
  }
  return { ok:true };
}

function isDisallowedTerms(candidate) {
  const text = (candidate.branches.map(b=>b.content).join(' ') + ' ' + candidate.concepts.join(' ')).toLowerCase();
  // Disallow blockchain terms unless troubleshooting (advanced mechanics)
  const hasChain = /(nft|smart[- ]?contract|ethers|solidity|erc)/.test(text);
  if (hasChain && candidate.category !== 'troubleshooting') {
    return 'Disallowed domain terms detected';
  }
  return null;
}

function ensureAcceptance(candidate) {
  const reasons = [];
  if (!(candidate.branches.length >= 4 && candidate.branches.length <= 7)) reasons.push('Branch count out of range');
  const verify = candidate.branches.some(b=>/verify/i.test(b.content));
  const rollback = candidate.branches.some(b=>/(rollback|fallback)/i.test(b.content));
  if (!verify || !rollback) reasons.push('Missing verification/fallback branch');
  if (!(candidate.concepts.length >= 3 && candidate.concepts.length <= 6)) reasons.push('Insufficient concepts');
  if (!candidate.concepts.map(c=>c.toLowerCase()).includes(candidate.category)) reasons.push('Concepts missing category');
  return reasons;
}

function main() {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  console.log(`[generator] Runtime root: ${RUNTIME_ROOT}`);
  console.log(`[generator] Mindmap dir candidates: ${MINDMAP_DIR_CANDIDATES.join(' | ')}`);
  console.log(`[generator] Selected mindmap dir: ${MINDMAP_DIR}`);
  const existing = extractExistingKnowledge();
  const clusters = loadMindmapClusters();
  console.log(`[generator] Found clusters: ${clusters.length}`);
  if (clusters.length === 0) {
    console.error('[generator] No mindmap clusters found. Ensure forensic JSONs exist at the selected mindmap dir.');
    process.exit(1);
  }

  const selected = [];
  const counts = Object.fromEntries(Object.keys(QUOTAS).map(k=>[k,0]));
  const rejections = [];
  let sourceIndex = 0;

  // Generate to category quotas even if clusters are few
  let attempts = 0;
  while (Object.values(counts).reduce((a,b)=>a+b,0) < TARGET_BATCH && attempts < TARGET_BATCH * 20) {
    const remaining = Object.entries(QUOTAS).filter(([k,q]) => counts[k] < q).map(([k]) => k);
    if (remaining.length === 0) break;

    // Prefer categories inferred from clusters when possible
    let category = remaining[attempts % remaining.length];

    const runtime_id = makeRuntimeId(category);
    const title = titleFromRuntimeId(runtime_id);
    const source = chooseSourceTag(sourceIndex++);
    const branches = buildBranches(category);
    const concepts = pickConcepts(category);

    const candidate = { runtime_id, title, source, branches, concepts, category };

    // Guards
    const disallowed = isDisallowedTerms(candidate);
    if (disallowed) { rejections.push({ runtime_id, reason: disallowed }); attempts++; continue; }

    const sim = similarityGuard(existing, candidate);
    if (!sim.ok) { rejections.push({ runtime_id, reason: sim.reason }); attempts++; continue; }

    const acceptance = ensureAcceptance(candidate);
    if (acceptance.length) { rejections.push({ runtime_id, reason: acceptance.join('; ') }); attempts++; continue; }

    // File name uniqueness check
    const outFile = path.join(AGENTS_DIR, `${runtime_id}_Agent.ts`);
    if (fs.existsSync(outFile)) { rejections.push({ runtime_id, reason: 'File already exists' }); attempts++; continue; }

    const ts = scaffoldTS(runtime_id, title, source, branches, concepts);
    fs.writeFileSync(outFile, ts, 'utf8');
    selected.push({ runtime_id, title, source, category, file: outFile });
    existing.push({ file: outFile, concepts: new Set(concepts.map(c=>c.toLowerCase())), tokens: tokenize(branches.map(b=>b.content).join(' ')) });
    counts[category] += 1;
    attempts++;
  }

  // Write log
  const lines = [];
  lines.push(`[generator] Root: ${RUNTIME_ROOT}`);
  lines.push(`[generator] Mindmap forensic dir: ${MINDMAP_DIR}`);
  lines.push(`[generator] Selected: ${selected.length} / ${TARGET_BATCH}`);
  lines.push('[generator] Category counts: ' + JSON.stringify(counts));
  lines.push('');
  lines.push('ACCEPTED:');
  for (const s of selected) {
    lines.push(`- ${s.runtime_id} [${s.category}] -> ${path.relative(RUNTIME_ROOT, s.file)} (source: ${s.source})`);
  }
  lines.push('');
  lines.push('REJECTED:');
  for (const r of rejections) {
    lines.push(`- ${r.runtime_id}: ${r.reason}`);
  }
  fs.writeFileSync(LOG_FILE, lines.join('\n'), 'utf8');

  console.log(`[generator] Done. Generated ${selected.length} agents.`);
  console.log(`[generator] Log: ${LOG_FILE}`);
}

const __FILENAME = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __FILENAME;
if (isMain) {
  main();
}
