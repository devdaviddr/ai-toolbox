import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface HealthData {
  status: 'healthy' | 'unhealthy' | 'rate_limited';
  database: string;
  timestamp: string;
  metrics?: {
    uptime?: number;
    memory?: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    responseTime?: number;
    dbResponseTime?: number;
  };
  system?: {
    nodeVersion: string;
    platform: string;
    architecture: string;
    environment: string;
    hostname: string;
  };
  testResult?: { test: number };
  error?: string;
  message?: string;
  retryAfter?: number;
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fetchHealth = async (): Promise<HealthData> => {
  const response = await axios.get(`${apiUrl}/health`);
  return response.data;
};

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};
