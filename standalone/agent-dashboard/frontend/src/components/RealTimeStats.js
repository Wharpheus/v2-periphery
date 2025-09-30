import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';

const RealTimeStats = ({ agents, logs }) => {
  // Prepare data for agent roles pie chart
  const roleCounts = agents.reduce((acc, agent) => {
    acc[agent.agent_role] = (acc[agent.agent_role] || 0) + 1;
    return acc;
  }, {});

  const roleData = Object.entries(roleCounts).map(([role, count]) => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: count,
    fill: getRoleColor(role)
  }));

  // Prepare data for signal grade distribution
  const gradeCounts = agents.reduce((acc, agent) => {
    acc[agent.signal_grade] = (acc[agent.signal_grade] || 0) + 1;
    return acc;
  }, {});

  const gradeData = Object.entries(gradeCounts).map(([grade, count]) => ({
    name: grade,
    value: count,
    fill: getGradeColor(grade)
  }));

  // Prepare entropy distribution data
  const entropyBuckets = agents.reduce((acc, agent) => {
    if (agent.entropy_score === null || agent.entropy_score === 0) {
      acc['No Data'] = (acc['No Data'] || 0) + 1;
    } else if (agent.entropy_score < 0.3) {
      acc['Low (< 0.3)'] = (acc['Low (< 0.3)'] || 0) + 1;
    } else if (agent.entropy_score < 0.6) {
      acc['Medium (0.3-0.6)'] = (acc['Medium (0.3-0.6)'] || 0) + 1;
    } else {
      acc['High (≥ 0.6)'] = (acc['High (≥ 0.6)'] || 0) + 1;
    }
    return acc;
  }, {});

  const entropyData = Object.entries(entropyBuckets).map(([range, count]) => ({
    range,
    count,
    fill: getEntropyColor(range)
  }));

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
          System Health Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Agent Health */}
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {Math.round((agents.filter(a => a.runtime_id).length / agents.length) * 100)}%
            </div>
            <div className="text-sm text-gray-300">Active Agents</div>
            <div className="text-xs text-gray-400">
              {agents.filter(a => a.runtime_id).length}/{agents.length} registered
            </div>
          </div>

          {/* Validation Success Rate */}
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {logs.validation ?
                Math.round((logs.validation.summary.kept / logs.validation.summary.total) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-300">Validation Pass Rate</div>
            <div className="text-xs text-gray-400">
              {logs.validation?.summary?.kept || 0}/{logs.validation?.summary?.total || 0} passed
            </div>
          </div>

          {/* Build Success Rate */}
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {logs.build ?
                Math.round((logs.build.agentsBuilt?.length || 0) / Math.max(agents.length, 1) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-300">Build Coverage</div>
            <div className="text-xs text-gray-400">
              {logs.build?.agentsBuilt?.length || 0} agents built
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Roles Distribution */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2 text-blue-400" />
            Agent Roles Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Grade Distribution */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <BarChart2 className="h-4 w-4 mr-2 text-green-400" />
            Signal Grade Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="value" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entropy Distribution */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <BarChart2 className="h-4 w-4 mr-2 text-purple-400" />
          Entropy Score Distribution
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={entropyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="range"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Helper functions for colors
function getRoleColor(role) {
  const colors = {
    'scaffolder': '#3B82F6',
    'validator': '#EF4444',
    'generator': '#10B981',
    'parser': '#8B5CF6',
    'minter': '#F59E0B',
    'docgen': '#EC4899',
    'deployer': '#06B6D4',
    'generic': '#6B7280'
  };
  return colors[role] || '#6B7280';
}

function getGradeColor(grade) {
  const colors = {
    'High': '#10B981',
    'Medium': '#F59E0B',
    'Low': '#EF4444',
    'Unknown': '#6B7280'
  };
  return colors[grade] || '#6B7280';
}

function getEntropyColor(range) {
  if (range.includes('High')) return '#10B981';
  if (range.includes('Medium')) return '#F59E0B';
  if (range.includes('Low')) return '#EF4444';
  return '#6B7280';
}

export default RealTimeStats;
