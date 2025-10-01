import React, { useState, useEffect } from 'react';
import { Activity, Users, AlertTriangle, CheckCircle, Zap, BarChart3 } from 'lucide-react';
import AgentList from './components/AgentList';
import ValidationResults from './components/ValidationResults';
import BuildMonitor from './components/BuildMonitor';
import RealTimeStats from './components/RealTimeStats';
import CreateAgent from './components/CreateAgent';
import { apiRequest } from './utils/api';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();

    // Set up WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        console.log('Real-time update received:', data);
        fetchDashboardData();
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => ws.close();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await apiRequest('http://localhost:3000/api/dashboard');
      setDashboardData(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const agents = dashboardData?.dashboard?.agents || [];
  const logs = dashboardData?.logs || {};
  const runtimeAgents = dashboardData?.runtimeAgents || [];

  // Calculate stats
  const totalAgents = agents.length;
  const activeAgents = agents.filter(agent => agent.runtime_id).length;
  const quarantinedAgents = logs.validation?.flagged?.length || 0;
  const highQualityAgents = agents.filter(agent =>
    agent.signal_grade === 'High' || agent.signal_grade === 'Medium'
  ).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Agent Monitor Dashboard</h1>
              <p className="text-gray-400">Real-time agent monitoring and management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div>Last updated: {new Date(dashboardData?.timestamp).toLocaleTimeString()}</div>
            <Activity className="h-4 w-4 text-green-400" />
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Agents</p>
              <p className="text-3xl font-bold">{totalAgents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-3xl font-bold text-green-400">{activeAgents}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Quarantined</p>
              <p className="text-3xl font-bold text-red-400">{quarantinedAgents}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Quality</p>
              <p className="text-3xl font-bold text-yellow-400">{highQualityAgents}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <AgentList agents={agents} runtimeAgents={runtimeAgents} />
          <ValidationResults validationData={logs.validation} />
        </div>
        <div className="space-y-6">
          <BuildMonitor buildData={logs.build} />
          <RealTimeStats agents={agents} logs={logs} />
        </div>
        <div>
          <CreateAgent onAgentCreated={fetchDashboardData} />
        </div>
      </main>
    </div>
  );
}

export default App;
