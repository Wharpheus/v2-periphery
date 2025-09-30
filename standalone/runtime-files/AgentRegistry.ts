// AgentRegistry.ts

type AgentClass = { new (...args: any[]): any; execute: (payload: any) => Promise<any> | any };
type AgentMetadata = {
  runtime_id: string;
  title: string;
  agent_role: string;
  file?: string;
  [key: string]: any;
};

interface RegisteredAgent {
  agentClass: AgentClass;
  metadata: AgentMetadata;
}

export class AgentRegistry {
  private agents: Map<string, RegisteredAgent> = new Map();

  registerAgent(type: string, agentClass: AgentClass, metadata: AgentMetadata) {
    if (!type || !agentClass) {
      throw new Error("Agent type and class are required for registration.");
    }
    if (this.agents.has(type)) {
      const msg = `[AgentRegistry] Duplicate agent type detected: ${type}. Registration skipped.`;
      console.error(msg);
      throw new Error(msg);
    }
    this.agents.set(type, { agentClass, metadata });
    console.info(`[AgentRegistry] Registered agent: ${type} (${metadata?.title || "No title"})`);
  }

  unregisterAgent(type: string) {
    this.agents.delete(type);
    console.info(`[AgentRegistry] Unregistered agent: ${type}`);
  }

  resolveAgent(type: string): RegisteredAgent | undefined {
    return this.agents.get(type);
  }

  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentMetadata(type: string): AgentMetadata | undefined {
    return this.agents.get(type)?.metadata;
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();

// Registration helper functions
export function registerAgent(type: string, agentClass: AgentClass, metadata: AgentMetadata) {
  agentRegistry.registerAgent(type, agentClass, metadata);
}

export function unregisterAgent(type: string) {
  agentRegistry.unregisterAgent(type);
}

export function resolveAgent(type: string): RegisteredAgent | undefined {
  return agentRegistry.resolveAgent(type);
}

// Build registry from dashboard.json at runtime
export async function buildAgentRegistryFromDashboard() {
  // Step 1: Load dashboard.json (agent metadata list)
  let dashboard;
  try {
    dashboard = (await import('../agent-dashboard/dashboard.json', { assert: { type: "json" } })).default;
  } catch (err) {
    console.error("[AgentRegistry] Failed to load dashboard.json:", err);
    return;
  }
  if (!dashboard?.agents || !Array.isArray(dashboard.agents)) {
    console.error("[AgentRegistry] dashboard.json missing 'agents' array.");
    return;
  }

  const registrationResults: {
    runtime_id?: string;
    file?: string;
    status: "success" | "skipped" | "error";
    error?: string;
  }[] = [];

  // Step 2: For each agentMeta in dashboard.agents
  for (const agentMeta of dashboard.agents) {
    const { runtime_id, file } = agentMeta;
    // Step 3: Validate required properties
    if (!runtime_id || !file) {
      const msg = `[AgentRegistry] Agent entry missing runtime_id or file: ${JSON.stringify(agentMeta)}`;
      console.warn(msg);
      registrationResults.push({ runtime_id, file, status: "skipped", error: msg });
      continue;
    }
    // Step 3b: Check for duplicate agent type
    if (agentRegistry.resolveAgent(runtime_id)) {
      const msg = `[AgentRegistry] Duplicate agent type detected: ${runtime_id}. Registration skipped.`;
      console.error(msg);
      registrationResults.push({ runtime_id, file, status: "skipped", error: msg });
      continue;
    }
    let agentModule;
    try {
      // Step 4: Dynamically import agent module
      agentModule = await import(`./agents/${file}`);
    } catch (err) {
      // Step 5: Log warning if import fails
      const msg = `[AgentRegistry] Failed to import agent module ${file}: ${err && err.message ? err.message : err}`;
      console.warn(msg);
      registrationResults.push({ runtime_id, file, status: "error", error: msg });
      continue;
    }
    // Step 6: Get agentClass (default export or first named export)
    const agentClass = agentModule?.default || agentModule?.[Object.keys(agentModule)[0]];
    if (!agentClass || typeof agentClass.execute !== "function") {
      const msg = `[AgentRegistry] Agent module ${file} does not export a valid agent class with .execute()`;
      console.warn(msg);
      registrationResults.push({ runtime_id, file, status: "error", error: msg });
      continue;
    }
    try {
      // Step 7: Register agent in registry
      agentRegistry.registerAgent(runtime_id, agentClass, agentMeta);
      registrationResults.push({ runtime_id, file, status: "success" });
    } catch (err) {
      // Step 8: Log warning if registration fails
      const msg = `[AgentRegistry] Failed to register agent ${runtime_id}: ${err && err.message ? err.message : err}`;
      console.warn(msg);
      registrationResults.push({ runtime_id, file, status: "error", error: msg });
      continue;
    }
  }

  // Optionally return or log registration summary
  if (registrationResults.some(r => r.status !== "success")) {
    console.warn("[AgentRegistry] Registration summary:", registrationResults);
  }
  return registrationResults;
}