// flowomaticCoinsProcessor.js — hardened replacement

import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import fs from 'fs';

const CONFIG = {
  REQUIRED_ENV_VARS: [
    'FLOWOMATIC_API_KEY',
    'FLOWOMATIC_API_URL',
    'FLOWOMATIC_DEFAULT_USER_ID',
    'FLOWOMATIC_USER_ID_ALIAS',
    'FLOWOMATIC_USER_EMAIL'
  ],
  ECONOMICAL_WINDOW_MS: 60 * 60 * 1000,
  BUDGET_LIMIT: 10000,
  BUDGET_RESET_INTERVAL_MS: 24 * 60 * 60 * 1000,
  QUEUE_EXPIRY_MS: 6 * 60 * 60 * 1000,
  PATTERNS: {
    transaction: /\b(transaction|transfer|exchange|spend|earn|redeem)\b/i,
    gamification: /\b(gamify|reward|level|badge|achievement|progress)\b/i,
    wallet: /\b(wallet|balance|account|deposit|withdraw)\b/i
  },
  ENTITY_REGEX: /\b(coin|user|reward|level|wallet|balance|transaction)\b/gi,
  STATE_FILE: './flowomatic_state.json', // persistence opt‑in
  ENABLE_STATE_PERSISTENCE: false
};

// state vars
let issuanceLog = {};
let analyticsLog = [];
let BUDGET_POOL = CONFIG.BUDGET_LIMIT;
let lastBudgetReset = Date.now();
let delayedQueue = [];
const errorLog = [];

// load persisted budget state if enabled
if (CONFIG.ENABLE_STATE_PERSISTENCE && fs.existsSync(CONFIG.STATE_FILE)) {
  try {
    const state = JSON.parse(fs.readFileSync(CONFIG.STATE_FILE, 'utf8'));
    BUDGET_POOL = state.BUDGET_POOL;
    lastBudgetReset = state.lastBudgetReset;
  } catch { /* ignore */ }
}

function persistState() {
  if (!CONFIG.ENABLE_STATE_PERSISTENCE) return;
  fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify({
    BUDGET_POOL,
    lastBudgetReset
  }), 'utf8');
}

function resetBudgetIfNeeded() {
  const now = Date.now();
  if (now - lastBudgetReset > CONFIG.BUDGET_RESET_INTERVAL_MS) {
    BUDGET_POOL = CONFIG.BUDGET_LIMIT;
    lastBudgetReset = now;
    persistState();
  }
}

class FlowomaticError extends Error {
  constructor({ type = 'FlowomaticError', message, context = {}, originalError = null, troubleshooting = '' }) {
    super(message);
    this.name = type;
    this.context = context;
    this.originalError = originalError;
    this.troubleshooting = troubleshooting;
    if (originalError?.stack) this.stack = originalError.stack;
  }
}

async function withRetry(fn, { retries = 2, delayMs = 500 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) { lastErr = err; if (i < retries) await new Promise(r => setTimeout(r, delayMs)); }
  }
  throw lastErr;
}

export class FlowomaticCoinsProcessor {
  static logEvent(type, detail) {
    const stamp = new Date().toISOString();
    console.info(`[${stamp}][${type}]`, detail);
  }

  static parseFlowomaticIntent(intent) {
    const parsed = {
      type: 'flowomatic-coins',
      action: 'unknown',
      entities: [],
      rewards: [],
      walletOps: []
    };
    for (const [type, pattern] of Object.entries(CONFIG.PATTERNS)) {
      if (pattern.test(intent)) { parsed.action = type; break; }
    }
    const entityMatches = intent.match(CONFIG.ENTITY_REGEX);
    if (entityMatches) parsed.entities = [...new Set(entityMatches.map(e => e.toLowerCase()))];
    return parsed;
  }

  static generateFlowomaticPayload(parsedIntent, options = {}) {
    const payload = {
      flowomaticAction: parsedIntent.action,
      rewardOps: parsedIntent.rewards,
      walletOps: parsedIntent.walletOps,
      implementationScope: options.scope || 'module',
      intelligenceMode: 'flowomatic-coins-enhanced'
    };
    if (parsedIntent.entities?.length) payload.entities = parsedIntent.entities;
    return payload;
  }

  static enhanceWithFlowomaticContext(basePayload, flowomaticContext) {
    return {
      ...basePayload,
      flowomaticIntelligence: {
        actionType: flowomaticContext.action,
        involvedEntities: flowomaticContext.entities,
        rewardOps: flowomaticContext.rewards,
        walletOps: flowomaticContext.walletOps
      },
      enhancedFeatures: [
        'transactional-logic',
        'gamification-rewards',
        'wallet-management',
        'user-balance-tracking'
      ]
    };
  }

  static async validateUserIds(possibleIds = null) {
    const token = process.env.FLOWOMATIC_API_KEY;
    const url = process.env.FLOWOMATIC_API_URL;
    const ids = possibleIds || [
      process.env.FLOWOMATIC_DEFAULT_USER_ID,
      process.env.FLOWOMATIC_USER_ID_ALIAS,
      process.env.FLOWOMATIC_USER_EMAIL
    ];
    const results = [];
    for (let id of ids) {
      try {
        const res = await withRetry(() =>
          axios.post(`${url}?type=random_tips`, {
            topic: 'validation test',
            voice: 'friendly',
            language: 'English',
            user_id: id
          }, {
            headers: { 'access-token': token, 'Content-Type': 'application/json' },
            timeout: 8000,
            validateStatus: s => s < 500
          })
        );
        this.logEvent('validateUserIds:success', { id, status: res.data.status });
        results.push({ id, status: res.data.status, success: true });
      } catch (err) {
        const errorData = err.response?.data || err.message;
        this.logEvent('validateUserIds:error', { id, error: errorData });
        results.push({ id, error: errorData, success: false });
      }
    }
    return results;
  }

  static async issueCoins(userId, amount, metadata = {}) {
    resetBudgetIfNeeded();
    const token = process.env.FLOWOMATIC_API_KEY;
    const url = process.env.FLOWOMATIC_API_URL;

    if (!userId || !amount) {
      const err = new FlowomaticError({
        type: 'FlowomaticCoinIssuanceError',
        message: 'userId and amount are required for coin issuance',
        context: { userId, amount },
        troubleshooting: 'Provide both userId and amount.'
      });
      errorLog.push(err);
      throw err;
    }

    if (BUDGET_POOL < amount) {
      const err = new FlowomaticError({
        type: 'FlowomaticBudgetExceeded',
        message: `Budget exceeded: Only ${BUDGET_POOL} coins left, tried to issue ${amount}.`,
        context: { userId, amount, BUDGET_POOL },
        troubleshooting: 'Wait for budget reset or reduce issuance amount.'
      });
      errorLog.push(err);
      analyticsLog.push({ event: 'budget_exceeded', userId, amount, BUDGET_POOL, time: Date.now() });
      return { success: false, error: err.message, flowomaticError: err };
    }

    return withRetry(async () => {
      const res = await axios.post(`${url}/issue`, {
        user_id: userId,
        amount,
        metadata
      }, {
        headers: { 'access-token': token, 'Content-Type': 'application/json' },
        timeout: 10000
      });
      BUDGET_POOL -= amount;
      issuanceLog[userId] = (issuanceLog[userId] || 0) + amount;
      persistState();
      this.logEvent('issueCoins:success', { userId, amount, remainingBudget: BUDGET_POOL });
      return { success: true, data: res.data };
    });
  }

  static getErrorLog() { return errorLog; }
  static getAnalyticsLog() { return analyticsLog; }
  static getIssuanceLog() { return issuanceLog; }
}
