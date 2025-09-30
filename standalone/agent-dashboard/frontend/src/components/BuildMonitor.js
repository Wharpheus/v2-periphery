import React from 'react';
import { Hammer, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const BuildMonitor = ({ buildData }) => {
  if (!buildData || !buildData.agentsBuilt) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4">Build Monitor</h2>
        <div className="text-center text-gray-400 py-8">
          <Hammer className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No build data available.</p>
        </div>
      </div>
    );
  }

  const { agentsBuilt, timestamp } = buildData;
  const successfulBuilds = agentsBuilt.length;

  // Extract unique agent names (remove duplicates)
  const uniqueAgents = [...new Set(agentsBuilt.map(path => {
    const filename = path.split(/[/\\]/).pop();
    return filename.replace('_Agent.ts', '');
  }))];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Hammer className="h-5 w-5 mr-2 text-blue-400" />
        Build Monitor
      </h2>

      {/* Build Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-green-900 rounded-lg border border-green-700">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-400" />
          <div className="text-xl font-bold text-green-400">{successfulBuilds}</div>
          <div className="text-xs text-green-300">Agents Built</div>
        </div>
        <div className="text-center p-3 bg-blue-900 rounded-lg border border-blue-700">
          <Clock className="h-6 w-6 mx-auto mb-2 text-blue-400" />
          <div className="text-xl font-bold text-blue-400">{uniqueAgents.length}</div>
          <div className="text-xs text-blue-300">Unique Agents</div>
        </div>
      </div>

      {/* Agent Roles Distribution */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Agent Roles Built</h3>
        <div className="space-y-2">
          {uniqueAgents.slice(0, 10).map((agentName, index) => {
            // Extract role from agent name (simple heuristic)
            const getRoleFromName = (name) => {
              if (name.includes('docgen')) return 'Documentation';
              if (name.includes('scaffold')) return 'Scaffolding';
              if (name.includes('parser')) return 'Parsing';
              if (name.includes('minting')) return 'Minting';
              if (name.includes('validation')) return 'Validation';
              if (name.includes('deployment')) return 'Deployment';
              return 'Generic';
            };

            const role = getRoleFromName(agentName.toLowerCase());

            return (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <span className="text-sm text-gray-300 truncate">{agentName}</span>
                <span className="text-xs bg-blue-600 text-blue-200 px-2 py-1 rounded ml-2">
                  {role}
                </span>
              </div>
            );
          })}
          {uniqueAgents.length > 10 && (
            <div className="text-center text-gray-400 text-sm mt-2">
              ... and {uniqueAgents.length - 10} more agents
            </div>
          )}
        </div>
      </div>

      {/* Build Files */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center">
          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
          Build Output Files
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {agentsBuilt.slice(0, 15).map((path, index) => {
            const filename = path.split(/[/\\]/).pop();
            return (
              <div key={index} className="flex items-center p-2 bg-gray-700 rounded text-sm">
                <CheckCircle className="h-3 w-3 text-green-400 mr-2 flex-shrink-0" />
                <span className="text-gray-300 truncate">{filename}</span>
                <span className="text-xs text-gray-500 ml-auto bg-gray-600 px-1 rounded">
                  built
                </span>
              </div>
            );
          })}
          {agentsBuilt.length > 15 && (
            <div className="text-center text-gray-400 text-sm mt-2">
              ... and {agentsBuilt.length - 15} more files
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Last build: {new Date(timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default BuildMonitor;
