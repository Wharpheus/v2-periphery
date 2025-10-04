const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;

// Database file path
const DB_PATH = path.join(__dirname, 'agent_dashboard.db');

class AgentDashboardDB {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure database directory exists
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });

      // Open database connection
      this.db = new Database(DB_PATH);

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      // Create tables
      this.createTables();

      // Create indexes for better performance
      this.createIndexes();

      this.initialized = true;
      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  createTables() {
    // Agents table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runtime_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        concepts TEXT NOT NULL, -- JSON array
        branches TEXT NOT NULL, -- JSON array
        validation_score REAL,
        entropy REAL,
        branch_count INTEGER,
        concept_count INTEGER,
        semantic_coherence REAL,
        execution_feasibility REAL,
        resource_efficiency REAL,
        grade TEXT,
        pass BOOLEAN DEFAULT 0,
        reasons TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'validation', 'build', 'refactor'
        filename TEXT NOT NULL,
        content TEXT NOT NULL, -- JSON content
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Runtime agents table (for tracking generated agent files)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS runtime_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        runtime_id TEXT NOT NULL,
        file_size INTEGER,
        exists BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Dashboard stats table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dashboard_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_agents INTEGER DEFAULT 0,
        active_agents INTEGER DEFAULT 0,
        validation_pass_rate REAL DEFAULT 0,
        avg_entropy REAL DEFAULT 0,
        avg_score REAL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default dashboard stats if not exists
    const statsCount = this.db.prepare('SELECT COUNT(*) as count FROM dashboard_stats').get();
    if (statsCount.count === 0) {
      this.db.prepare(`
        INSERT INTO dashboard_stats (total_agents, active_agents, validation_pass_rate, avg_entropy, avg_score)
        VALUES (0, 0, 0, 0, 0)
      `).run();
    }
  }

  createIndexes() {
    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_agents_runtime_id ON agents(runtime_id);
      CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
      CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);
      CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_runtime_agents_filename ON runtime_agents(filename);
    `);
  }

  // Agent operations
  saveAgent(agentData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agents
      (runtime_id, title, category, source, concepts, branches, validation_score, entropy,
       branch_count, concept_count, semantic_coherence, execution_feasibility,
       resource_efficiency, grade, pass, reasons, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    return stmt.run(
      agentData.runtimeId,
      agentData.title,
      agentData.category,
      agentData.source,
      JSON.stringify(agentData.concepts || []),
      JSON.stringify(agentData.branches || []),
      agentData.validationScore?.score || null,
      agentData.validationScore?.entropy || null,
      agentData.validationScore?.branchCount || null,
      agentData.validationScore?.conceptCount || null,
      agentData.validationScore?.semanticCoherence || null,
      agentData.validationScore?.executionFeasibility || null,
      agentData.validationScore?.resourceEfficiency || null,
      agentData.validationScore?.grade || null,
      agentData.validationScore?.pass ? 1 : 0,
      JSON.stringify(agentData.validationScore?.reasons || [])
    );
  }

  getAllAgents() {
    const stmt = this.db.prepare(`
      SELECT * FROM agents ORDER BY created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(row => ({
      ...row,
      concepts: JSON.parse(row.concepts || '[]'),
      branches: JSON.parse(row.branches || '[]'),
      validationScore: row.validation_score ? {
        score: row.validation_score,
        entropy: row.entropy,
        branchCount: row.branch_count,
        conceptCount: row.concept_count,
        semanticCoherence: row.semantic_coherence,
        executionFeasibility: row.execution_feasibility,
        resourceEfficiency: row.resource_efficiency,
        grade: row.grade,
        pass: row.pass === 1,
        reasons: JSON.parse(row.reasons || '[]')
      } : null
    }));
  }

  getAgentByRuntimeId(runtimeId) {
    const stmt = this.db.prepare('SELECT * FROM agents WHERE runtime_id = ?');
    const row = stmt.get(runtimeId);

    if (!row) return null;

    return {
      ...row,
      concepts: JSON.parse(row.concepts || '[]'),
      branches: JSON.parse(row.branches || '[]'),
      validationScore: row.validation_score ? {
        score: row.validation_score,
        entropy: row.entropy,
        branchCount: row.branch_count,
        conceptCount: row.concept_count,
        semanticCoherence: row.semantic_coherence,
        executionFeasibility: row.execution_feasibility,
        resourceEfficiency: row.resource_efficiency,
        grade: row.grade,
        pass: row.pass === 1,
        reasons: JSON.parse(row.reasons || '[]')
      } : null
    };
  }

  // Log operations
  saveLog(type, filename, content) {
    const stmt = this.db.prepare(`
      INSERT INTO logs (type, filename, content) VALUES (?, ?, ?)
    `);
    return stmt.run(type, filename, JSON.stringify(content));
  }

  getLatestLogs() {
    const logs = {};

    // Get latest validation log
    const validationStmt = this.db.prepare(`
      SELECT content FROM logs WHERE type = 'validation'
      ORDER BY created_at DESC LIMIT 1
    `);
    const validationRow = validationStmt.get();
    if (validationRow) {
      logs.validation = JSON.parse(validationRow.content);
    }

    // Get latest build log
    const buildStmt = this.db.prepare(`
      SELECT content FROM logs WHERE type = 'build'
      ORDER BY created_at DESC LIMIT 1
    `);
    const buildRow = buildStmt.get();
    if (buildRow) {
      logs.build = JSON.parse(buildRow.content);
    }

    // Get latest refactor log
    const refactorStmt = this.db.prepare(`
      SELECT content FROM logs WHERE type = 'refactor'
      ORDER BY created_at DESC LIMIT 1
    `);
    const refactorRow = refactorStmt.get();
    if (refactorRow) {
      logs.refactor = JSON.parse(refactorRow.content);
    }

    return logs;
  }

  // Runtime agent operations
  saveRuntimeAgent(filename, runtimeId, fileSize) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO runtime_agents
      (filename, runtime_id, file_size, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(filename, runtimeId, fileSize);
  }

  getAllRuntimeAgents() {
    const stmt = this.db.prepare(`
      SELECT * FROM runtime_agents WHERE exists = 1 ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  // Dashboard stats operations
  updateDashboardStats(stats) {
    const stmt = this.db.prepare(`
      UPDATE dashboard_stats SET
        total_agents = ?,
        active_agents = ?,
        validation_pass_rate = ?,
        avg_entropy = ?,
        avg_score = ?,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = 1
    `);
    return stmt.run(
      stats.totalAgents || 0,
      stats.activeAgents || 0,
      stats.validationPassRate || 0,
      stats.avgEntropy || 0,
      stats.avgScore || 0
    );
  }

  getDashboardStats() {
    const stmt = this.db.prepare('SELECT * FROM dashboard_stats WHERE id = 1');
    return stmt.get();
  }

  // Migration helper
  async migrateFromFiles() {
    console.log('🔄 Starting migration from file-based storage to SQLite...');

    try {
      // Migrate dashboard.json if it exists
      const dashboardPath = path.join(__dirname, 'dashboard.json');
      if (await this.fileExists(dashboardPath)) {
        const dashboardData = await this.readJsonFile(dashboardPath);
        if (dashboardData?.agents) {
          console.log(`📦 Migrating ${dashboardData.agents.length} agents from dashboard.json...`);
          for (const agent of dashboardData.agents) {
            this.saveAgent(agent);
          }
        }
      }

      // Migrate logs
      const logsDir = path.join(__dirname, '..', 'logs');
      if (await this.fileExists(logsDir)) {
        const logFiles = await fs.readdir(logsDir);
        for (const logFile of logFiles) {
          const logPath = path.join(logsDir, logFile);
          const logData = await this.readJsonFile(logPath);

          let logType = 'unknown';
          if (logFile.startsWith('agents_validation_')) logType = 'validation';
          else if (logFile.startsWith('agents_build_')) logType = 'build';
          else if (logFile.startsWith('agent_refactor_report_')) logType = 'refactor';

          this.saveLog(logType, logFile, logData);
        }
        console.log(`📦 Migrated ${logFiles.length} log files...`);
      }

      // Migrate runtime agents
      const runtimeAgentsDir = path.join(__dirname, '..', 'runtime-files', 'agents');
      if (await this.fileExists(runtimeAgentsDir)) {
        const agentFiles = await fs.readdir(runtimeAgentsDir);
        const tsFiles = agentFiles.filter(f => f.endsWith('_Agent.ts'));

        for (const tsFile of tsFiles) {
          const filePath = path.join(runtimeAgentsDir, tsFile);
          const stats = await fs.stat(filePath);
          const runtimeId = tsFile.replace('_Agent.ts', '');
          this.saveRuntimeAgent(tsFile, runtimeId, stats.size);
        }
        console.log(`📦 Migrated ${tsFiles.length} runtime agent files...`);
      }

      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return null;
    }
  }

  // Cleanup and maintenance
  vacuum() {
    this.db.exec('VACUUM');
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Export singleton instance
const db = new AgentDashboardDB();
module.exports = db;
