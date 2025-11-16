import { Link } from 'react-router-dom';

export default function Modules() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Modules</h1>
        <p className="text-slate-300 text-lg">Available application modules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI RAG Search Module */}
        <Link
          to="/modules/rag"
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-700/80 transition-colors block"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-2xl">
              🔍
            </div>
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">AI RAG Search</h3>
          <p className="text-slate-400 text-sm">
            Retrieval-Augmented Generation for intelligent document search and analysis
          </p>
        </Link>

        {/* Batch Processing Module */}
        <Link
          to="/modules/batch-processing"
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-700/80 transition-colors block"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
              ⚙️
            </div>
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Batch Processing</h3>
          <p className="text-slate-400 text-sm">
            High-performance batch processing for large-scale data operations
          </p>
        </Link>

        {/* Placeholder Module */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 opacity-50">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center text-2xl">
              ✨
            </div>
            <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded-full">
              Soon
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Module 3</h3>
          <p className="text-slate-400 text-sm">Upcoming feature...</p>
        </div>
      </div>
    </div>
  );
}
