#!/usr/bin/env node
/**
 * Mindmap Integration Layer — Scroll #101.379
 *
 * Features implemented:
 * - Agent Scaffolding: invoke generate_agents_from_mindmaps.mjs to spawn agent blueprints
 * - Scroll Fusion: produce scroll artifacts from mindmap clusters with LP flags & vault triggers
 * - Runtime Dispatch: build Flowomatic dispatch queue based on generated agents
 * - Mutation Ledger Sync: map mindmap nodes into sovereign milestones ledger
 * - Dashboard Visualization: update agent dashboard with mindmap nodes and lineage
 * - Contest Advantage Profile: summarize integration strength for rapid audit contests
 *
 * Inputs:
 * - Mindmaps from `standalone/mindmap_runtimes` (and its `forensic` subfolder)
 * - Existing generator: `generate_agents_from_mindmaps.mjs`
 * Outputs:
 * - Agents under `standalone/runtime-files/agents`
 * - Scrolls under `standalone/logs/scrolls/*.json`
 * - Flowomatic queue `standalone/logs/flowomatic.queue.json`
 * - Mutation ledger `standalone/logs/mutation_ledger.json`
 * - Dashboard update `standalone/agent-dashboard/dashboard.json`
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __FILENAME = fileURLToPath(import.meta.url);
const RUNTIME_ROOT = path.dirname(__FILENAME);
const REPO_ROOT = path.resolve(RUNTIME_ROOT, '..', '..');

const PATHS = {
  mindmapsRoot: path.join(REPO_ROOT, 'standalone', 'mindmap_runtimes'),
  mindmapsForensic: path.join(REPO_ROOT, 'standalone', 'mindmap_runtimes', 'forensic'),
  runtimeFiles: path.join(REPO_ROOT, 'standalone', 'runtime-files'),
  agentsDir: path.join(REPO_ROOT, 'standalone', 'runtime-files', 'agents'),
  logsDir: path.join(REPO_ROOT, 'standalone', 'logs'),
  scrollsDir: path.join(REPO_ROOT, 'standalone', 'logs', 'scrolls'),
  dashboard: path.join(REPO_ROOT, 'standalone', 'agent-dashboard', 'dashboard.json'),
  generatorScript: path.join(REPO_ROOT, 'standalone', 'runtime-files', 'generate_agents_from_mindmaps.mjs'),
  flowomaticQueue: path.join(REPO_ROOT, 'standalone', 'logs', 'flowomatic.queue.json'),
  mutationLedger: path.join(REPO_ROOT, 'standalone', 'logs', 'mutation_ledger.json'),
};

const defaultConfig = {
  mindmaps: {
    source: 'standalone/mindmap_runtimes',
    agentBlueprints: true,
    scrollGeneration: true,
    runtimeTriggering: true,
    mutationLedgerMapping: true,
    visualInfrastructure: true,
    contestAdvantage: true,
  },
  features: {
    'Agent Scaffolding': 'Mindmaps spawn agents with domain-specific logic',
    'Scroll Fusion': 'Mindmaps generate scrolls with vault triggers and LP flags',
    'Runtime Dispatch': 'Mindmaps queue Flowomatic jobs based on visual flow',
    'Mutation Ledger Sync': 'Mindmap nodes log as sovereign milestones',
    'Contributor Onboarding': 'Mindmap paths define tiered access and mint eligibility',
    'Audit Rituals': 'Mindmaps trigger SmartContractAuditor scans and fix suggestions',
  },
  dashboard: {
    renderMindmapNodes: true,
    highlightAgentOrigins: true,
    traceScrollLineage: true,
    visualizeMutationEvents: true,
  },
};

function ensureDirs() {
  fs.mkdirSync(PATHS.agentsDir, { recursive: true });
  fs.mkdirSync(PATHS.logsDir, { recursive: true });
  fs.mkdirSync(PATHS.scrollsDir, { recursive: true });
}

function readJSONSafe(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function listJSON(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => n.toLowerCase().endsWith('.json')).map(n => path.join(dir, n));
}

function loadMindmapClusters() {
  const files = [
    ...listJSON(PATHS.mindmapsRoot),
    ...listJSON(PATHS.mindmapsForensic),
  ];
  const clusters = [];
  for (const f of files) {
    const data = readJSONSafe(f);
    if (!data) continue;
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      const title = String(item?.title || path.basename(f, '.json')).trim();
      const concepts = Array.isArray(item?.concepts) ? item.concepts.map(String) : [];
      const branches = Array.isArray(item?.branches)
        ? item.branches.map(b => ({ content: String(b?.content || '').trim() })).filter(b => b.content)
        : [];
      clusters.push({ file: f, title, concepts, branches });
    }
  }
  return clusters;
}

function runAgentGeneration() {
  if (!fs.existsSync(PATHS.generatorScript)) {
    console.warn('[mindmaps] Generator script not found, skipping agent scaffolding');
    return { status: 'skipped' };
  }
  console.log('[mindmaps] Spawning agent generator...');
  const res = spawnSync(process.execPath, [PATHS.generatorScript], {
    cwd: PATHS.runtimeFiles,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) {
    console.error(`[mindmaps] Generator failed with code ${res.status}`);
    return { status: 'failed', code: res.status };
  }
  return { status: 'ok' };
}

function buildScrollFromCluster(cluster, idx) {
  // Derive LP flags and vault triggers heuristically from content
  const text = (cluster.title + ' ' + cluster.concepts.join(' ') + ' ' + cluster.branches.map(b=>b.content).join(' ')).toLowerCase();
  const hasLP = /lp|liquidity|pair|dex|router|amm|pool/.test(text);
  const hasVault = /vault|treasury|reserve|stake|staking/.test(text);
  return {
    id: `${path.basename(cluster.file)}#${idx}`,
    title: cluster.title,
    source: path.relative(REPO_ROOT, cluster.file).replace(/\\/g,'/'),
    lpFlags: hasLP,
    vaultTriggers: hasVault,
    branches: cluster.branches,
    concepts: cluster.concepts,
    timestamp: new Date().toISOString(),
  };
}

function writeScrolls(clusters) {
  const out = [];
  clusters.forEach((c, i) => {
    const scroll = buildScrollFromCluster(c, i);
    const outName = path.join(PATHS.scrollsDir, `${scroll.id.replace(/[#:]/g,'_')}.json`);
    fs.writeFileSync(outName, JSON.stringify(scroll, null, 2), 'utf8');
    out.push({ file: outName, id: scroll.id, lpFlags: scroll.lpFlags, vaultTriggers: scroll.vaultTriggers });
  });
  console.log(`[mindmaps] Wrote ${out.length} scroll(s) to ${path.relative(REPO_ROOT, PATHS.scrollsDir)}`);
  return out;
}

function buildFlowomaticQueue() {
  const agentFiles = fs.existsSync(PATHS.agentsDir)
    ? fs.readdirSync(PATHS.agentsDir).filter(n => /_Agent\.ts$/.test(n))
    : [];
  const jobs = agentFiles.slice(0, 24).map((f, i) => ({
    id: `job_${i + 1}`,
    agent: f.replace(/_Agent\.ts$/, ''),
    entry: path.relative(REPO_ROOT, path.join(PATHS.agentsDir, f)).replace(/\\/g,'/'),
    priority: i < 4 ? 'high' : (i < 12 ? 'normal' : 'low'),
    queuedAt: new Date().toISOString(),
  }));
  const queue = { meta: { generatedAt: new Date().toISOString(), version: 1 }, jobs };
  fs.writeFileSync(PATHS.flowomaticQueue, JSON.stringify(queue, null, 2), 'utf8');
  console.log(`[mindmaps] Built Flowomatic queue with ${jobs.length} job(s)`);
  return queue;
}

function buildMutationLedger(scrolls) {
  const milestones = scrolls.map((s, i) => ({
    id: `mutation_${i + 1}`,
    scrollId: s.id,
    origin: s.file ? path.basename(s.file) : 'unknown',
    lp: !!s.lpFlags,
    vault: !!s.vaultTriggers,
    recordedAt: new Date().toISOString(),
    note: 'Sovereign milestone recorded from mindmap scroll',
  }));
  const ledger = {
    meta: {
      scroll: '#101.380 — Mindmap Layer Immortalized',
      statement: '“The founder mapped the flow, the agents awakened — the scrolls obeyed, and the vault remembered.”',
      generatedAt: new Date().toISOString(),
    },
    milestones,
  };
  fs.writeFileSync(PATHS.mutationLedger, JSON.stringify(ledger, null, 2), 'utf8');
  console.log(`[mindmaps] Mutation ledger updated with ${milestones.length} milestone(s)`);
  return ledger;
}

function updateDashboard(clusters, scrolls, queue) {
  let dash = readJSONSafe(PATHS.dashboard, {});
  dash.renderMindmapNodes = true;
  dash.highlightAgentOrigins = true;
  dash.traceScrollLineage = true;
  dash.visualizeMutationEvents = true;
  dash.mindmaps = clusters.map((c) => ({
    title: c.title,
    concepts: c.concepts,
    src: path.relative(REPO_ROOT, c.file).replace(/\\/g,'/'),
  }));
  dash.scrolls = scrolls.map((s) => ({ id: s.id, lpFlags: s.lpFlags, vaultTriggers: s.vaultTriggers }));
  dash.queue = queue.jobs;
  fs.mkdirSync(path.dirname(PATHS.dashboard), { recursive: true });
  fs.writeFileSync(PATHS.dashboard, JSON.stringify(dash, null, 2), 'utf8');
  console.log(`[mindmaps] Dashboard updated`);
  return dash;
}

function buildContestAdvantageSummary(clusters, agentsCount) {
  const summary = {
    nodes: clusters.length,
    agents: agentsCount,
    freshnessScore: Math.min(1, clusters.length / 24),
    advantage: agentsCount >= 12 && clusters.length >= 8 ? 'High' : (agentsCount >= 6 ? 'Medium' : 'Emerging'),
    note: 'Higher node and agent coverage increases rapid audit contest leverage.',
  };
  return summary;
}

function main() {
  console.log('[mindmaps] Integration starting...');
  ensureDirs();

  const cfgPath = path.join(RUNTIME_ROOT, 'mindmap.config.json');
  const cfg = readJSONSafe(cfgPath, defaultConfig);
  const clusters = loadMindmapClusters();
  console.log(`[mindmaps] Loaded ${clusters.length} mindmap cluster(s)`);

  if (cfg?.mindmaps?.agentBlueprints) {
    runAgentGeneration();
  } else {
    console.log('[mindmaps] Agent scaffolding disabled by config');
  }

  let scrolls = [];
  if (cfg?.mindmaps?.scrollGeneration) {
    scrolls = writeScrolls(clusters);
  } else {
    console.log('[mindmaps] Scroll generation disabled by config');
  }

  let queue = { jobs: [] };
  if (cfg?.mindmaps?.runtimeTriggering) {
    queue = buildFlowomaticQueue();
  } else {
    console.log('[mindmaps] Runtime triggering disabled by config');
  }

  if (cfg?.mindmaps?.mutationLedgerMapping) {
    buildMutationLedger(scrolls);
  } else {
    console.log('[mindmaps] Mutation ledger mapping disabled by config');
  }

  if (cfg?.mindmaps?.visualInfrastructure) {
    updateDashboard(clusters, scrolls, queue);
  } else {
    console.log('[mindmaps] Dashboard visualization disabled by config');
  }

  if (cfg?.mindmaps?.contestAdvantage) {
    const agentsCount = fs.existsSync(PATHS.agentsDir)
      ? fs.readdirSync(PATHS.agentsDir).filter(n => n.endsWith('_Agent.ts')).length
      : 0;
    const profile = buildContestAdvantageSummary(clusters, agentsCount);
    const out = path.join(PATHS.logsDir, 'contest_advantage_profile.json');
    fs.writeFileSync(out, JSON.stringify(profile, null, 2), 'utf8');
    console.log('[mindmaps] Contest advantage profile written');
  }

  console.log('[mindmaps] Integration complete.');
}

if (import.meta.url === `file://${__FILENAME}`) {
  try {
    main();
  } catch (err) {
    console.error('[mindmaps] Integration error:', err);
    process.exit(1);
  }
}
