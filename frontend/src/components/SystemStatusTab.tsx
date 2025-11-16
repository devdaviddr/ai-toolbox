import { useHealth } from '../hooks';

const SystemStatusTab = () => {
  const { data, isLoading, error, refetch } = useHealth();

  if (isLoading) {
    return (
      <div data-testid="system-status-component" className="bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
          </div>
          <span className="text-blue-300 font-medium">Checking system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="system-status-component" className="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">❌</span>
            <div className="flex-1">
              <h4 className="text-red-300 font-semibold">System Status Check Failed</h4>
              <p className="text-red-400 text-sm">Unable to connect to backend service</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isHealthy = data?.status === 'healthy';
  const isRateLimited = data?.status === 'rate_limited';

  return (
    <div className="space-y-6">
      {/* Main Health Status */}
      <div
        data-testid="system-status-component"
        className={`rounded-lg p-6 transition-all duration-300 ${
          isRateLimited
            ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 border border-yellow-500/30'
            : isHealthy
            ? 'bg-gradient-to-r from-green-900/40 to-emerald-800/40 border border-green-500/30'
            : 'bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/30'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className={`text-2xl animate-pulse`}>
              {isRateLimited ? '⏱️' : isHealthy ? '✅' : '❌'}
            </span>
            <div className="flex-1">
              <h4 className={`font-semibold ${
                isRateLimited ? 'text-yellow-300' : isHealthy ? 'text-green-300' : 'text-red-300'
              }`}>
                System {isRateLimited ? 'Rate Limited' : isHealthy ? 'Healthy' : 'Unhealthy'}
              </h4>
              <p className={`text-sm ${
                isRateLimited ? 'text-yellow-400' : isHealthy ? 'text-green-400' : 'text-red-400'
              }`}>
                Database: <span className="font-medium">{data?.database}</span>
              </p>
              {data?.timestamp && (
                <p className="text-xs text-slate-400 mt-1">
                  Last checked: {new Date(data.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Metrics */}
      {data?.metrics && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            System Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-300 mb-1">Uptime</div>
              <div className="text-xl font-semibold text-white">
                {data.metrics.uptime ? `${Math.floor(data.metrics.uptime / 3600)}h ${Math.floor((data.metrics.uptime % 3600) / 60)}m` : 'N/A'}
              </div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-300 mb-1">Response Time</div>
              <div className="text-xl font-semibold text-white">
                {data.metrics.responseTime ? `${data.metrics.responseTime}ms` : 'N/A'}
              </div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-300 mb-1">DB Response Time</div>
              <div className="text-xl font-semibold text-white">
                {data.metrics.dbResponseTime ? `${data.metrics.dbResponseTime}ms` : 'N/A'}
              </div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-300 mb-1">Memory Usage</div>
              <div className="text-xl font-semibold text-white">
                {data.metrics.memory ? `${data.metrics.memory.heapUsed}MB` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Details */}
      {data?.metrics?.memory && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            Memory Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{data.metrics.memory.heapUsed}MB</div>
              <div className="text-sm text-slate-300">Heap Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{data.metrics.memory.heapTotal}MB</div>
              <div className="text-sm text-slate-300">Heap Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{data.metrics.memory.external}MB</div>
              <div className="text-sm text-slate-300">External</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{data.metrics.memory.rss}MB</div>
              <div className="text-sm text-slate-300">RSS</div>
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      {data?.system && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Node.js Version
              </label>
              <p className="text-white bg-slate-700 px-3 py-2 rounded font-mono">
                {data.system.nodeVersion}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Environment
              </label>
              <p className="text-white bg-slate-700 px-3 py-2 rounded">
                {data.system.environment}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Platform
              </label>
              <p className="text-white bg-slate-700 px-3 py-2 rounded">
                {data.system.platform} ({data.system.architecture})
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Hostname
              </label>
              <p className="text-white bg-slate-700 px-3 py-2 rounded font-mono">
                {data.system.hostname}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatusTab;