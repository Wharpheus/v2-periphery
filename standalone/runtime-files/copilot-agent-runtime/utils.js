// utils.js — hardened buildPayload helper

const DEFAULTS = {
  source: 'ClinemapRuntime',
  walletAddress: '0x000000000000000000000000000000000000dead',
  network: 'ethereum',
  theme: 'dark'
};

const COMMAND_BUILDERS = {
  'mint-nft': (intent, base) => ({
    ...base,
    type: 'mint-nft',
    metadata: intent.meta,
    contractParams: intent.contractParams || {},
    userWallet: intent.walletAddress || DEFAULTS.walletAddress
  }),

  'deploy-smart-contract': (intent, base) => ({
    ...base,
    type: 'deploy-smart-contract',
    contractCode: intent.code,
    network: intent.network || DEFAULTS.network
  }),

  'generate-landing-page': (intent, base) => ({
    ...base,
    type: 'generate-landing-page',
    theme: intent.theme || DEFAULTS.theme,
    copyBlocks: intent.copy || []
  })
};

export function buildPayload(intent) {
  if (!intent || typeof intent !== 'object') {
    throw new Error('Intent must be an object');
  }
  if (!intent.command || typeof intent.command !== 'string') {
    throw new Error('Intent.command must be a non-empty string');
  }

  const basePayload = {
    timestamp: Date.now(),
    command: intent.command,
    source: DEFAULTS.source
  };

  const builder = COMMAND_BUILDERS[intent.command];
  const payload = builder
    ? builder(intent, basePayload)
    : { ...basePayload, type: 'generic-task', details: intent };

  // Optional: log build event
  console.info(`[${new Date().toISOString()}] buildPayload`, payload);

  return payload;
}
