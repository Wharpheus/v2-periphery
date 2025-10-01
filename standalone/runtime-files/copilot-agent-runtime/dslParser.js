// dslParser.js — hardened version
// 🧬 Regex purified — DoS vector neutralized
import { MindMapProcessor } from './mindMapProcessor.js';
import { FlowomaticCoinsProcessor } from './flowomaticCoinsProcessor.js';

const CONFIG = {
  PATTERNS: {
    nftMint: /^create.*?nft.*?mint.*?trigger$/i,
    deploymentLogic: /^deploy.*?logic|deployment.*?script$/i,
    moduleGeneration: /^create.*?module|generate.*?component$/i,
    apiEndpoint: /^create.*?api|generate.*?endpoint$/i,
    smartContract: /^smart.*?contract|blockchain.*?logic$/i,
    mindMapEnhanced: /\b(mind\s*map|conceptual|structure|hierarchy|relationship)\b/i,
    flowomaticCoins: /\b(flowomatic\s*coin|coin\s*system|gamify|reward|wallet|balance|transaction)\b/i
  },
  ENTITY_REGEX: /\b(NFT|SHA|log|vault|trigger|mint|deploy|API|endpoint)\b/gi,
  MODIFIER_REGEX: /\b(secure|async|encrypted|automated|scalable)\b/gi,
  FRAMEWORK_MAP: [
    { key: ['react', 'tsx'], value: 'react' },
    { key: ['vue'], value: 'vue' },
    { key: ['node', 'express'], value: 'node' }
  ]
};

export class DSLParser {
  static logEvent(type, detail) {
    const stamp = new Date().toISOString();
    console.info(`[${stamp}][${type}]`, detail);
  }

  static parse(intent) {
    try {
      if (!intent || typeof intent !== 'string') {
        throw new Error('Intent must be a non-empty string');
      }

      const parsed = {
        type: 'unknown',
        entities: [],
        modifiers: [],
        targetFramework: null
      };

      // Pattern matching
      for (const [type, pattern] of Object.entries(CONFIG.PATTERNS)) {
        if (pattern.test(intent)) {
          parsed.type = type;
          break;
        }
      }

      // Entities
      const entityMatches = intent.match(CONFIG.ENTITY_REGEX);
      if (entityMatches) {
        parsed.entities = entityMatches;
      }

      // Modifiers
      const modifierMatches = intent.match(CONFIG.MODIFIER_REGEX);
      if (modifierMatches) {
        parsed.modifiers = modifierMatches;
      }

      // Framework detection
      for (const framework of CONFIG.FRAMEWORK_MAP) {
        for (const keyword of framework.key) {
          if (intent.toLowerCase().includes(keyword)) {
            parsed.targetFramework = framework.value;
            break;
          }
        }
        if (parsed.targetFramework) break;
      }

      DSLParser.logEvent('parse', `Parsed intent: ${intent.substring(0, 50)}...`);
      return parsed;

    } catch (error) {
      DSLParser.logEvent('error', `Parse error: ${error.message}`);
      throw error;
    }
  }
}
