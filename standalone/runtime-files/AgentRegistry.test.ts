import { SmartContractAgent } from "./copilot-agent-runtime/agents/SmartContractAgent";
import { DeploymentAgent } from "./quarantine/smart_contract_deployment_pipeline_6b5413_Agent";
import eventBus from "./eventBus";

describe("SmartContractAgent edge cases", () => {
  let agent: SmartContractAgent;
  let events: any[];

  beforeEach(() => {
    agent = new SmartContractAgent();
    events = [];
    eventBus.on("contract:validation_failed", (payload) => events.push({ type: "failed", payload }));
    eventBus.on("contract:validated", (payload) => events.push({ type: "validated", payload }));
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  it("should emit validation_failed for missing contractCode", () => {
    eventBus.emit("contract:submitted", {});
    expect(events[0].type).toBe("failed");
    expect(events[0].payload.errors).toContain("Missing contractCode");
  });

  it("should emit validation_failed for empty contractCode", () => {
    eventBus.emit("contract:submitted", { contractCode: "   " });
    expect(events[0].type).toBe("failed");
    expect(events[0].payload.errors).toContain("Contract code is empty");
  });

  it("should emit validation_failed for invalid contractCode", () => {
    eventBus.emit("contract:submitted", { contractCode: "bad_code" });
    expect(events[0].type).toBe("failed");
    expect(events[0].payload.errors).toContain("Invalid contract");
  });

  it("should emit validated for valid contractCode", () => {
    eventBus.emit("contract:submitted", { contractCode: "valid" });
    expect(events[0].type).toBe("validated");
    expect(events[0].payload.contractCode).toBe("valid");
  });

  it("should ignore duplicate contract submissions (idempotency)", () => {
    eventBus.emit("contract:submitted", { contractCode: "valid" });
    eventBus.emit("contract:submitted", { contractCode: "valid" });
    expect(events.length).toBe(1);
  });
});

describe("DeploymentAgent edge cases", () => {
  let agent: DeploymentAgent;
  let events: any[];

  beforeEach(() => {
    agent = new DeploymentAgent();
    events = [];
    eventBus.on("contract:deployment_failed", (payload) => events.push({ type: "failed", payload }));
    eventBus.on("contract:deployed", (payload) => events.push({ type: "deployed", payload }));
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  it("should emit deployment_failed for missing contractCode", () => {
    eventBus.emit("contract:validated", {});
    expect(events[0].type).toBe("failed");
    expect(events[0].payload.error).toBe("Missing contractCode");
  });

  it("should emit deployment_failed for simulated failure", () => {
    eventBus.emit("contract:validated", { contractCode: "fail" });
    expect(events[0].type).toBe("failed");
    expect(events[0].payload.error).toBe("Deployment failed");
  });

  it("should emit deployed for valid contractCode", () => {
    eventBus.emit("contract:validated", { contractCode: "valid" });
    expect(events[0].type).toBe("deployed");
    expect(events[0].payload.address).toBe("0xabc");
  });

  it("should ignore duplicate deployments (idempotency)", () => {
    eventBus.emit("contract:validated", { contractCode: "valid" });
    eventBus.emit("contract:validated", { contractCode: "valid" });
    expect(events.length).toBe(1);
  });
});