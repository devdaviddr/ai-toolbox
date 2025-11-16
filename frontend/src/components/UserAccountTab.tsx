import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const UserAccountTab = () => {
  const auth = useContext(AuthContext);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  if (!auth) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mr-3"></div>
          <span className="text-slate-300">Loading authentication context...</span>
        </div>
      </div>
    );
  }

  const { user, logout, loading, getAccessToken } = auth;

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mr-3"></div>
          <span className="text-slate-300">Loading user information...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl mb-4 block">👤</span>
            <h3 className="text-lg font-semibold text-white mb-2">No User Information</h3>
            <p className="text-slate-400">Please log in to view your account details.</p>
          </div>
        </div>
      </div>
    );
  }

  const claims = user.idTokenClaims || {};
  const displayName = claims.name || 'Unknown User';
  const email = claims.preferred_username || claims.email || 'No email';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      await getAccessToken();
      // Token refreshed successfully
    } catch {
      // Error is handled by getAccessToken, no need to log here
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">{displayName}</h3>
            <p className="text-slate-400">{email}</p>
          </div>
        </div>

        {/* Account Management Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRefreshToken}
            disabled={isRefreshingToken}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isRefreshingToken ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh Token
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* User Details */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          Account Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Full Name
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {claims.name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {email}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              User ID
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded font-mono text-sm break-all">
              {user.localAccountId || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tenant ID
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded font-mono text-sm break-all">
              {user.tenantId || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Username
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {claims.preferred_username || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Given Name
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {claims.given_name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Family Name
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {claims.family_name || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Account Type
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {user.authorityType || 'Azure AD'}
            </p>
          </div>
        </div>
      </div>

      {/* Roles and Permissions */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
          Roles & Permissions
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Assigned Roles
            </label>
            {claims.roles && claims.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {claims.roles.map((role: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-600 text-yellow-100 text-sm rounded-full"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 bg-slate-700 px-3 py-2 rounded">
                No roles assigned
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Groups
            </label>
            {claims.groups ? (
              <div className="text-white bg-slate-700 px-3 py-2 rounded font-mono text-sm break-all">
                {Array.isArray(claims.groups) ? claims.groups.join(', ') : claims.groups}
              </div>
            ) : (
              <p className="text-slate-400 bg-slate-700 px-3 py-2 rounded">
                No group information available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Token Information */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
          Token Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Token Issued At
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {claims.iat ? new Date(claims.iat * 1000).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Token Expires At
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded">
              {claims.exp ? new Date(claims.exp * 1000).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Issuer
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded font-mono text-sm break-all">
              {claims.iss || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Audience
            </label>
            <p className="text-white bg-slate-700 px-3 py-2 rounded font-mono text-sm break-all">
              {claims.aud || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Claims */}
      {Object.keys(claims).length > 10 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
            All Claims (Raw)
          </h3>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm whitespace-pre-wrap">
              {JSON.stringify(claims, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccountTab;