#!/usr/bin/env node

/**
 * Build Monitor and Analytics Script
 * Tracks build performance, size, and optimization metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      buildTime: 0,
      contractCount: 0,
      totalSize: 0,
      optimizationLevel: 'default',
      gasUsage: 0,
      errors: [],
      warnings: []
    };
  }

  async analyzeBuild() {
    console.log('🔍 Analyzing build metrics...');

    try {
      // Get contract count
      this.metrics.contractCount = this.getContractCount();

      // Get build size
      this.metrics.totalSize = this.getBuildSize();

      // Get gas usage if tests exist
      this.metrics.gasUsage = this.getGasUsage();

      // Get optimization level
      this.metrics.optimizationLevel = this.getOptimizationLevel();

      this.metrics.buildTime = Date.now() - this.startTime;

      this.generateReport();

    } catch (error) {
      console.error('❌ Build analysis failed:', error.message);
      this.metrics.errors.push(error.message);
    }
  }

  getContractCount() {
    try {
      const contractsDir = path.join(__dirname, '../contracts');
      const files = fs.readdirSync(contractsDir);
      return files.filter(file => file.endsWith('.sol')).length;
    } catch {
      return 0;
    }
  }

  getBuildSize() {
    try {
      const outDir = path.join(__dirname, '../out');
      if (!fs.existsSync(outDir)) return 0;

      let totalSize = 0;
      const files = fs.readdirSync(outDir, { recursive: true });

      files.forEach(file => {
        const filePath = path.join(outDir, file);
        if (fs.statSync(filePath).isFile()) {
          totalSize += fs.statSync(filePath).size;
        }
      });

      return totalSize;
    } catch {
      return 0;
    }
  }

  getGasUsage() {
    try {
      // Run a quick test to get gas report
      const gasReport = execSync('forge test --gas-report --allow-failure', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Extract gas usage from report (simplified)
      const lines = gasReport.split('\n');
      let totalGas = 0;

      lines.forEach(line => {
        if (line.includes('gas')) {
          const match = line.match(/(\d+)\s+gas/);
          if (match) {
            totalGas += parseInt(match[1]);
          }
        }
      });

      return totalGas;
    } catch {
      return 0;
    }
  }

  getOptimizationLevel() {
    try {
      const foundryToml = fs.readFileSync(path.join(__dirname, '../foundry.toml'), 'utf8');

      if (foundryToml.includes('optimizer_runs = 1000000')) {
        return 'production';
      } else if (foundryToml.includes('optimizer_runs = 200')) {
        return 'optimized';
      } else {
        return 'default';
      }
    } catch {
      return 'unknown';
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      buildTime: `${this.metrics.buildTime}ms`,
      contractCount: this.metrics.contractCount,
      totalSize: `${(this.metrics.totalSize / 1024).toFixed(2)} KB`,
      optimizationLevel: this.metrics.optimizationLevel,
      gasUsage: this.metrics.gasUsage,
      errors: this.metrics.errors,
      warnings: this.metrics.warnings,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(__dirname, '../build-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console output
    console.log('\n📊 Build Report');
    console.log('================');
    console.log(`⏱️  Build Time: ${report.buildTime}`);
    console.log(`📄 Contracts: ${report.contractCount}`);
    console.log(`📦 Total Size: ${report.totalSize}`);
    console.log(`⚡ Optimization: ${report.optimizationLevel}`);
    console.log(`⛽ Gas Usage: ${report.gasUsage}`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    if (report.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.errors.forEach(error => console.log(`  • ${error}`));
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.buildTime > 30000) {
      recommendations.push('Consider using parallel builds (forge build --parallel)');
    }

    if (this.metrics.totalSize > 5 * 1024 * 1024) {
      recommendations.push('Build size is large, consider code splitting');
    }

    if (this.metrics.optimizationLevel === 'default') {
      recommendations.push('Use optimized profile for production builds');
    }

    if (this.metrics.contractCount > 20) {
      recommendations.push('Consider breaking down into multiple projects');
    }

    return recommendations;
  }
}

// CLI interface
async function main() {
  const monitor = new BuildMonitor();

  if (process.argv.includes('--watch')) {
    console.log('👀 Watching for build changes...');
    // Watch mode implementation would go here
  } else {
    await monitor.analyzeBuild();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BuildMonitor;
