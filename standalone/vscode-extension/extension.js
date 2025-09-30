const vscode = require('vscode');
const path = require('path');
const http = require('http');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Agent Monitor Dashboard extension is now active!');

	// Tree data provider for the sidebar view
	class AgentDashboardProvider {
		constructor() {
			this._onDidChangeTreeData = new vscode.EventEmitter();
			this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		}

		getTreeItem(element) {
			return element;
		}

		getChildren(element) {
			if (!element) {
				// Root level - show main dashboard items
				const items = [
					new AgentDashboardItem('📊 Dashboard', 'agentMonitorDashboard.openDashboard', vscode.TreeItemCollapsibleState.None),
					new AgentDashboardItem('🔄 Refresh', 'agentMonitorDashboard.refresh', vscode.TreeItemCollapsibleState.None),
					new AgentDashboardItem('📈 Statistics', 'agentMonitorDashboard.showStats', vscode.TreeItemCollapsibleState.Expanded),
					new AgentDashboardItem('🏗️ Build Monitor', 'agentMonitorDashboard.showBuilds', vscode.TreeItemCollapsibleState.Expanded),
				];
				return Promise.resolve(items);
			}

			// Show sub-items based on parent
			if (element.label === '📈 Statistics') {
				return Promise.resolve([
					new AgentDashboardItem('Agent Health', 'agentMonitorDashboard.showAgentHealth', vscode.TreeItemCollapsibleState.None),
					new AgentDashboardItem('Validation Report', 'agentMonitorDashboard.showValidation', vscode.TreeItemCollapsibleState.None),
				]);
			}

			if (element.label === '🏗️ Build Monitor') {
				return Promise.resolve([
					new AgentDashboardItem('Latest Build', 'agentMonitorDashboard.showLatestBuild', vscode.TreeItemCollapsibleState.None),
					new AgentDashboardItem('Build History', 'agentMonitorDashboard.showBuildHistory', vscode.TreeItemCollapsibleState.None),
				]);
			}

			return Promise.resolve([]);
		}
	}

	class AgentDashboardItem extends vscode.TreeItem {
		constructor(label, command, collapsibleState = vscode.TreeItemCollapsibleState.None) {
			super(label, collapsibleState);
			this.command = {
				command: command,
				title: label,
				arguments: []
			};
		}
	}

	const provider = new AgentDashboardProvider();
	vscode.window.registerTreeDataProvider('agentMonitorDashboard', provider);

	// Command to open the dashboard
	let openDashboardCommand = vscode.commands.registerCommand('agentMonitorDashboard.openDashboard', async () => {
		try {
			// Check if dashboard server is running
			const dashboardUrl = 'http://localhost:3000';

			const isServerRunning = await checkServerHealth(dashboardUrl);
			if (!isServerRunning) {
				const startServer = await vscode.window.showInformationMessage(
					'Dashboard server is not running. Would you like to start it?',
					'Yes', 'No'
				);

				if (startServer === 'Yes') {
					await startDashboardServer();
				} else {
					vscode.window.showErrorMessage('Please start the dashboard server first: cd standalone/agent-dashboard && npm start');
					return;
				}
			}

			// Create and show webview panel
			const panel = vscode.window.createWebviewPanel(
				'agentDashboard',
				'Agent Monitor Dashboard',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
				}
			);

			// Set the HTML content to embed our dashboard
			panel.webview.html = getDashboardHtml(dashboardUrl);

		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open dashboard: ${error.message}`);
			console.error('Dashboard error:', error);
		}
	});

	// Command to refresh data
	let refreshCommand = vscode.commands.registerCommand('agentMonitorDashboard.refresh', () => {
		provider._onDidChangeTreeData.fire();
		vscode.window.showInformationMessage('Dashboard refreshed');
	});

	// Commands for individual views
	let showStatsCommand = vscode.commands.registerCommand('agentMonitorDashboard.showStats', () => {
		vscode.window.showInformationMessage('Showing statistics view (feature coming soon)');
	});

	let showBuildsCommand = vscode.commands.registerCommand('agentMonitorDashboard.showBuilds', () => {
		vscode.window.showInformationMessage('Showing build monitor view (feature coming soon)');
	});

	let showAgentHealthCommand = vscode.commands.registerCommand('agentMonitorDashboard.showAgentHealth', () => {
		vscode.window.showInformationMessage('Showing agent health (feature coming soon)');
	});

	let showValidationCommand = vscode.commands.registerCommand('agentMonitorDashboard.showValidation', () => {
		vscode.window.showInformationMessage('Showing validation report (feature coming soon)');
	});

	let showLatestBuildCommand = vscode.commands.registerCommand('agentMonitorDashboard.showLatestBuild', () => {
		vscode.window.showInformationMessage('Showing latest build details (feature coming soon)');
	});

	let showBuildHistoryCommand = vscode.commands.registerCommand('agentMonitorDashboard.showBuildHistory', () => {
		vscode.window.showInformationMessage('Showing build history (feature coming soon)');
	});

	context.subscriptions.push(
		openDashboardCommand,
		refreshCommand,
		showStatsCommand,
		showBuildsCommand,
		showAgentHealthCommand,
		showValidationCommand,
		showLatestBuildCommand,
		showBuildHistoryCommand
	);
}

// Function to check if dashboard server is running
function checkServerHealth(url) {
	return new Promise((resolve) => {
		const req = http.request(url, { method: 'HEAD' }, (res) => {
			resolve(res.statusCode === 200);
		});

		req.on('error', () => resolve(false));
		req.setTimeout(2000, () => {
			req.destroy();
			resolve(false);
		});
		req.end();
	});
}

// Function to start dashboard server
async function startDashboardServer() {
	const terminal = vscode.window.createTerminal('Agent Dashboard');
	terminal.show();

	// Navigate to dashboard directory and start server
	const dashboardPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'standalone', 'agent-dashboard');
	terminal.sendText(`cd "${dashboardPath}" && npm start`);

	// Wait a bit for server to start
	await new Promise(resolve => setTimeout(resolve, 3000));

	vscode.window.showInformationMessage('Starting dashboard server... This may take a few moments.');
}

// Function to generate HTML for the webview
function getDashboardHtml(dashboardUrl) {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Agent Dashboard</title>
			<style>
				body {
					margin: 0;
					padding: 0;
					background-color: #1f2937;
					color: white;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				}
				.header {
					background-color: #111827;
					border-bottom: 1px solid #374151;
					padding: 12px 16px;
					font-size: 14px;
				}
				iframe {
					width: 100%;
					height: calc(100vh - 50px);
					border: none;
				}
				.loading {
					display: flex;
					align-items: center;
					justify-content: center;
					height: 100vh;
					flex-direction: column;
				}
				.spinner {
					border: 4px solid #374151;
					border-top: 4px solid #3b82f6;
					border-radius: 50%;
					width: 40px;
					height: 40px;
					animation: spin 1s linear infinite;
					margin-bottom: 16px;
				}
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			</style>
		</head>
		<body>
			<div class="header">
				🏠 Agent Monitor Dashboard - Integrated View
			</div>
			<div id="loading" class="loading">
				<div class="spinner"></div>
				<div>Loading Agent Monitor Dashboard...</div>
			</div>
			<iframe id="dashboard-iframe" src="${dashboardUrl}" style="display: none;" onload="hideLoading()"></iframe>

			<script>
				function hideLoading() {
					document.getElementById('loading').style.display = 'none';
					document.getElementById('dashboard-iframe').style.display = 'block';
				}

				// Fallback: show iframe after 3 seconds if load event doesn't fire
				setTimeout(() => {
					const loading = document.getElementById('loading');
					const iframe = document.getElementById('dashboard-iframe');
					if (loading.style.display !== 'none') {
						loading.style.display = 'none';
						iframe.style.display = 'block';
					}
				}, 3000);
			</script>
		</body>
		</html>
	`;
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
