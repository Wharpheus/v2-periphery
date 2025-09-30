// mindMapProcessor.js — hardened replacement
import crypto from 'crypto';

const CONFIG = {
  PATTERNS: {
    hierarchical: /\b(structure|hierarchy|breakdown|organize|categorize)\b/i,
    workflow: /\b(process|flow|steps|sequence|pipeline)\b/i,
    relationships: /\b(connect|relate|link|associate|dependency)\b/i,
    brainstorming: /\b(ideas|concepts|explore|brainstorm|generate)\b/i
  },
  CONCEPT_KEYWORDS: [
    'app', 'mobile', 'development', 'selling', 'marketing', 'monetization',
    'feature', 'ui', 'ux', 'backend', 'frontend', 'api', 'database'
  ]
};

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

class MindMapError extends Error {
  constructor({ type = 'MindMapError', message, context = {}, originalError = null, troubleshooting = '' }) {
    super(message);
    this.name = type;
    this.context = context;
    this.originalError = originalError;
    this.troubleshooting = troubleshooting;
    this.timestamp = new Date().toISOString();
    this.fingerprint = sha256(`${type}|${message}|${JSON.stringify(context)}`);
    if (originalError?.stack) this.stack = originalError.stack;
  }
}

const mindMapErrorLog = [];
const recoveryHooks = {};

export class MindMapProcessor {
  static registerRecoveryHook(errorType, callback) {
    recoveryHooks[errorType] = callback;
    this.logEvent('registerRecoveryHook', { errorType });
  }

  static logEvent(type, detail) {
    const stamp = new Date().toISOString();
    console.info(`[${stamp}][${type}]`, detail);
  }

  static parseMindMapIntent(intent, mindMapData = null) {
    try {
      const parsed = {
        type: 'mindmap',
        structure: 'unknown',
        concepts: [],
        relationships: [],
        hierarchy: []
      };

      for (const [type, pattern] of Object.entries(CONFIG.PATTERNS)) {
        if (pattern.test(intent)) {
          parsed.structure = type;
          break;
        }
      }

      const conceptRegex = new RegExp(`\\b(${CONFIG.CONCEPT_KEYWORDS.join('|')})\\b`, 'gi');
      const matches = intent.match(conceptRegex);
      if (matches) parsed.concepts = [...new Set(matches.map(c => c.toLowerCase()))];

      this.validateStructure(parsed, 'MindMapParseError');
      return parsed;
    } catch (err) {
      return this.handleError('MindMapParseError', `Failed to parse mind map intent: ${err.message}`, { intent, mindMapData }, err);
    }
  }

  static generateMindMapPayload(parsedIntent, options = {}) {
    try {
      const payload = {
        mindMapStructure: parsedIntent.structure,
        concepts: parsedIntent.concepts,
        relationships: parsedIntent.relationships,
        contextualDepth: options.depth || 'medium',
        implementationScope: options.scope || 'module',
        intelligenceMode: 'mindmap-enhanced'
      };
      this.validateStructure(payload, 'MindMapPayloadError');
      return payload;
    } catch (err) {
      return this.handleError('MindMapPayloadError', `Failed to generate mind map payload: ${err.message}`, { parsedIntent, options }, err);
    }
  }

  static enhanceWithMindMapContext(basePayload, mindMapContext) {
    try {
      const enhanced = {
        ...basePayload,
        mindMapIntelligence: {
          conceptualFramework: mindMapContext.concepts,
          structuralApproach: mindMapContext.structure,
          relationshipMapping: mindMapContext.relationships,
          hierarchicalDepth: mindMapContext.hierarchy
        },
        enhancedFeatures: [
          'conceptual-code-generation',
          'structural-architecture',
          'relationship-aware-imports',
          'hierarchical-organization'
        ]
      };
      this.validateStructure(enhanced, 'MindMapEnhanceError');
      return enhanced;
    } catch (err) {
      return this.handleError('MindMapEnhanceError', `Failed to enhance mind map context: ${err.message}`, { basePayload, mindMapContext }, err);
    }
  }

  static troubleshootingReport({ search = '', type = '' } = {}) {
    let filtered = mindMapErrorLog;
    if (type) filtered = filtered.filter(e => e.name === type);
    if (search) filtered = filtered.filter(e => JSON.stringify(e).toLowerCase().includes(search.toLowerCase()));
    return filtered.map(e => ({
      type: e.name,
      message: e.message,
      context: e.context,
      troubleshooting: e.troubleshooting,
      fingerprint: e.fingerprint,
      timestamp: e.timestamp,
      stack: e.stack
    }));
  }

  static getErrorLog() { return mindMapErrorLog; }

  // Helpers
  static handleError(type, message, context, originalError) {
    const error = new MindMapError({ type, message, context, originalError, troubleshooting: context?.troubleshooting || '' });
    mindMapErrorLog.push(error);
    console.error(error);
    if (recoveryHooks[type]) recoveryHooks[type](error);
    return { error };
  }

  static validateStructure(obj, errorType) {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid structure');
    if (errorType && (!obj.type && !obj.mindMapStructure)) {
      throw new Error('Structure missing type information');
    }
  }
}
