import { useParams } from 'react-router-dom';

const modules = {
  rag: {
    title: 'RAG Module',
  },
  'batch-processing': {
    title: 'Batch Processing Module',
  },
};

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const module = modules[id as keyof typeof modules];

  if (!module) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Module Not Found</h2>
        <p className="text-slate-400">The requested module does not exist.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-white">{module.title}</h1>
    </div>
  );
}
