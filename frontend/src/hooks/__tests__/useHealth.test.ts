import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { useHealth } from '../useHealth';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return Wrapper;
};

describe('useHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy data on successful fetch', async () => {
    const mockData = {
      status: 'healthy' as const,
      database: 'connected',
      timestamp: '2024-01-01T00:00:00Z',
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useHealth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/health');
  });

  it('should handle error states', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });
});
