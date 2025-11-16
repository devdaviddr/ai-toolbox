import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SystemStatusTab from '../SystemStatusTab';

// Mock the useHealth hook
const mockUseHealth = vi.fn();
vi.mock('../../hooks/useHealth', () => ({
  useHealth: () => mockUseHealth(),
}));

describe('SystemStatusTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when data is loading', () => {
    mockUseHealth.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemStatusTab />);

    expect(screen.getByText('Checking system status...')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-component')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    const mockRefetch = vi.fn();
    mockUseHealth.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    render(<SystemStatusTab />);

    expect(screen.getByText('System Status Check Failed')).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to backend service')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('shows healthy system status', () => {
    const mockData = {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      metrics: {
        uptime: 3600,
        responseTime: 150,
        dbResponseTime: 50,
        memory: {
          heapUsed: 100,
          heapTotal: 200,
          external: 10,
          rss: 300,
        },
      },
      system: {
        nodeVersion: 'v18.0.0',
        environment: 'production',
        platform: 'linux',
        architecture: 'x64',
        hostname: 'server-01',
      },
    };

    mockUseHealth.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemStatusTab />);

    expect(screen.getByText('System Healthy')).toBeInTheDocument();
    expect(screen.getByText('Database:')).toBeInTheDocument();
    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(screen.getByText('System Metrics')).toBeInTheDocument();
    expect(screen.getByText('Memory Details')).toBeInTheDocument();
    expect(screen.getByText('System Information')).toBeInTheDocument();
  });

  it('shows rate limited status', () => {
    mockUseHealth.mockReturnValue({
      data: { status: 'rate_limited' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemStatusTab />);

    expect(screen.getByText('System Rate Limited')).toBeInTheDocument();
  });

  it('shows unhealthy status', () => {
    mockUseHealth.mockReturnValue({
      data: { status: 'unhealthy' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemStatusTab />);

    expect(screen.getByText('System Unhealthy')).toBeInTheDocument();
  });

  it('formats uptime correctly', () => {
    mockUseHealth.mockReturnValue({
      data: {
        status: 'healthy',
        metrics: { uptime: 7265 }, // 2h 1m 5s
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemStatusTab />);

    expect(screen.getByText('2h 1m')).toBeInTheDocument();
  });

  it('handles missing metrics gracefully', () => {
    mockUseHealth.mockReturnValue({
      data: { status: 'healthy' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemStatusTab />);

    // When metrics is missing, the metrics sections should not render
    expect(screen.queryByText('System Metrics')).not.toBeInTheDocument();
    expect(screen.queryByText('Memory Details')).not.toBeInTheDocument();
  });

  it('refreshes data when refresh button is clicked', () => {
    const mockRefetch = vi.fn();
    mockUseHealth.mockReturnValue({
      data: { status: 'healthy' },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<SystemStatusTab />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});