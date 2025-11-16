import { useHealth } from '../hooks';

const Health = () => {
  const { data, isLoading, error, refetch } = useHealth();

  if (isLoading) {
    return (
      <div data-testid="health-component" className="bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
          </div>
          <span className="text-blue-300 font-medium">Checking system health...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="health-component" className="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">❌</span>
            <div className="flex-1">
              <h4 className="text-red-300 font-semibold">Health Check Failed</h4>
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

  return (
    <div
      data-testid="health-component"
      className={`rounded-lg p-4 transition-all duration-300 ${
        isHealthy
          ? 'bg-gradient-to-r from-green-900/40 to-emerald-800/40 border border-green-500/30'
          : 'bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/30'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className={`text-2xl animate-pulse`}>{isHealthy ? '✅' : '❌'}</span>
          <div className="flex-1">
            <h4 className={`font-semibold ${isHealthy ? 'text-green-300' : 'text-red-300'}`}>
              System {isHealthy ? 'Healthy' : 'Unhealthy'}
            </h4>
            <p className={`text-sm ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>
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
  );
};

export default Health;
