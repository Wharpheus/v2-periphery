import React from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { CARD_CONTAINER, TITLE_BASE, EMPTY_STATE, EMPTY_ICON } from '../constants/styles';

const AgentList = ({ agents, runtimeAgents }) => {
  const getRuntimeAgentStatus = (runtimeId) => {
    return runtimeAgents.find(agent => agent.runtime_id === runtimeId);
  };

  const getSignalGradeColor = (grade) => {
    switch (grade) {
      case 'High': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (agent) => {
    const runtimeStatus = getRuntimeAgentStatus(agent.runtime_id);

    if (runtimeStatus) {
      return <Check className="h-4 w-4 text-green-400" />;
    }
    if (agent.runtime_id) {
      return <Info className="h-4 w-4 text-blue-400" />;
    }
    return <X className="h-4 w-4 text-red-400" />;
  };

  return (
    <div className={CARD_CONTAINER}>
      <h2 className={TITLE_BASE}>Agent Registry</h2>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {agents.map((agent, index) => (
          <div key={agent.file || index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(agent)}
                  <h3 className="font-semibold text-lg">{agent.title}</h3>
                  <span className={`text-sm px-2 py-1 rounded ${getSignalGradeColor(agent.signal_grade)} bg-gray-600`}>
                    {agent.signal_grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <span className="text-gray-400">Role:</span> {agent.agent_role}
                  </div>
                  <div>
                    <span className="text-gray-400">Entropy:</span> {agent.entropy_score?.toFixed(3) || 'N/A'}
                  </div>
                  <div>
                    <span className="text-gray-400">Branches:</span> {agent.branch_count || 'N/A'}
                  </div>
                  <div>
                    <span className="text-gray-400">Runtime ID:</span>
                    <code className="ml-1 bg-gray-600 px-1 rounded text-xs">
                      {agent.runtime_id || 'None'}
                    </code>
                  </div>
                </div>

                {agent.concepts && agent.concepts.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-400 text-sm">Concepts:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agent.concepts.map((concept, idx) => (
                        <span key={idx} className="bg-blue-600 text-xs px-2 py-1 rounded">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {agent.lineage && (
                  <div className="mt-2 text-xs text-gray-400">
                    <span>Forensic Status: {agent.lineage.forensic_status}</span>
                    {agent.lineage.mindmap && (
                      <span className="ml-2">Mindmap: {agent.lineage.mindmap}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Show file status */}
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>{agent.file}</span>
                <div className="flex items-center space-x-2">
                  {agent.runtime_id && getRuntimeAgentStatus(agent.runtime_id) ? (
                    <span className="text-green-400 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Built
                    </span>
                  ) : (
                    <span className="text-gray-500">Not Built</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className={EMPTY_STATE}>
          <Info className={EMPTY_ICON} />
          <p>No agents registered yet.</p>
        </div>
      )}
    </div>
  );
};

export default AgentList;
