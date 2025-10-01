import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { CARD_CONTAINER, TITLE_BASE, EMPTY_STATE, EMPTY_ICON } from '../constants/styles';

const ValidationResults = ({ validationData }) => {
  if (!validationData) {
    return (
      <div className={CARD_CONTAINER}>
        <h2 className={TITLE_BASE}>Validation Results</h2>
        <div className={EMPTY_STATE}>
          <BarChart3 className={EMPTY_ICON} />
          <p>No validation data available.</p>
        </div>
      </div>
    );
  }

  const { summary, flagged, thresholds } = validationData;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4">Validation Results</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{summary.total}</div>
          <div className="text-xs text-gray-400">Total Agents</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{summary.kept}</div>
          <div className="text-xs text-gray-400">Passed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{summary.flagged}</div>
          <div className="text-xs text-gray-400">Flagged</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{Math.round((summary.flagged / summary.total) * 100)}%</div>
          <div className="text-xs text-gray-400">Fail Rate</div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2">Validation Thresholds</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Min Entropy:</span>
            <span className="ml-2 font-mono">{thresholds.minEntropy}</span>
          </div>
          <div>
            <span className="text-gray-400">Min Branches:</span>
            <span className="ml-2 font-mono">{thresholds.minBranches}</span>
          </div>
        </div>
      </div>

      {/* Flagged Agents */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
          Flagged Agents ({flagged.length})
        </h3>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {flagged.map((agent, index) => (
            <div key={agent.file || index} className="bg-red-900 border border-red-700 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-red-300 truncate">{agent.title}</h4>
                  <p className="text-sm text-red-400">{agent.agent_role}</p>

                  {/* Flagging reasons */}
                  <div className="mt-2">
                    <div className="text-xs text-red-300">Reasons:</div>
                    <ul className="text-xs text-red-400 mt-1 space-y-1">
                      {agent.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Agent stats */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-300">
                    <div>Entropy: {agent.entropy_score}</div>
                    <div>Branches: {agent.branch_count}</div>
                    <div className="col-span-3">Grade: {agent.signal_grade}</div>
                  </div>
                </div>

                <div className="ml-3 text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-800 text-red-200">
                    {agent.action}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {flagged.length === 0 && (
            <div className="text-center text-green-400 py-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No agents flagged - all passed validation!</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center">
        Last validation: {new Date(validationData.generated_at).toLocaleString()}
      </div>
    </div>
  );
};

export default ValidationResults;
