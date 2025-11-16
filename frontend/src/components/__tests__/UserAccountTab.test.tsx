import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserAccountTab from '../UserAccountTab';

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  logout: vi.fn(),
  loading: false,
  getAccessToken: vi.fn(),
};

const mockUseContext = vi.fn();
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: () => mockUseContext(),
  };
});

describe('UserAccountTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContext.mockReturnValue(mockAuthContext);
  });

  it('shows loading state when auth context is loading', () => {
    mockUseContext.mockReturnValue({ ...mockAuthContext, loading: true });

    render(<UserAccountTab />);

    expect(screen.getByText('Loading user information...')).toBeInTheDocument();
  });

  it('shows no auth context message when context is null', () => {
    mockUseContext.mockReturnValue(null);

    render(<UserAccountTab />);

    expect(screen.getByText('Loading authentication context...')).toBeInTheDocument();
  });

  it('shows no user message when user is not available', () => {
    render(<UserAccountTab />);

    expect(screen.getByText('No User Information')).toBeInTheDocument();
    expect(screen.getByText('Please log in to view your account details.')).toBeInTheDocument();
  });

  it('displays user information correctly', () => {
    const mockUser = {
      localAccountId: 'user123',
      tenantId: 'tenant456',
      authorityType: 'Azure AD',
      idTokenClaims: {
        name: 'John Doe',
        preferred_username: 'john.doe@example.com',
        email: 'john.doe@example.com',
        given_name: 'John',
        family_name: 'Doe',
        roles: ['admin', 'user'],
        groups: ['group1', 'group2'],
        iat: 1640995200, // Jan 1, 2022
        exp: 1641081600, // Jan 2, 2022
        iss: 'https://login.microsoftonline.com/tenant456/v2.0',
        aud: 'audience123',
      },
    };

    mockUseContext.mockReturnValue({ ...mockAuthContext, user: mockUser });

    render(<UserAccountTab />);

    // Check display name in header
    expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
    // Check email in header (first occurrence)
    expect(screen.getAllByText('john.doe@example.com')[0]).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
  });

  it('handles token refresh', async () => {
    const mockGetAccessToken = vi.fn().mockResolvedValue('new-token');
    mockUseContext.mockReturnValue({
      ...mockAuthContext,
      user: { idTokenClaims: { name: 'Test User' } },
      getAccessToken: mockGetAccessToken,
    });

    await act(async () => {
      render(<UserAccountTab />);
    });

    const refreshButton = screen.getByText('🔄 Refresh Token');
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(mockGetAccessToken).toHaveBeenCalledTimes(1);
  });

  it('handles logout', () => {
    const mockLogout = vi.fn();
    mockUseContext.mockReturnValue({
      ...mockAuthContext,
      user: { idTokenClaims: { name: 'Test User' } },
      logout: mockLogout,
    });

    render(<UserAccountTab />);

    const logoutButton = screen.getByText('🚪 Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('displays roles correctly', () => {
    const mockUser = {
      idTokenClaims: {
        name: 'Test User',
        roles: ['admin', 'editor'],
      },
    };

    mockUseContext.mockReturnValue({ ...mockAuthContext, user: mockUser });

    render(<UserAccountTab />);

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();
  });

  it('shows no roles message when no roles are assigned', () => {
    const mockUser = {
      idTokenClaims: {
        name: 'Test User',
        roles: [],
      },
    };

    mockUseContext.mockReturnValue({ ...mockAuthContext, user: mockUser });

    render(<UserAccountTab />);

    expect(screen.getByText('No roles assigned')).toBeInTheDocument();
  });

  it('displays token information correctly', () => {
    const mockUser = {
      idTokenClaims: {
        name: 'Test User',
        iat: 1640995200,
        exp: 1641081600,
        iss: 'https://example.com',
        aud: 'audience123',
      },
    };

    mockUseContext.mockReturnValue({ ...mockAuthContext, user: mockUser });

    render(<UserAccountTab />);

    expect(screen.getByText(/Token Issued At/)).toBeInTheDocument();
    expect(screen.getByText(/Token Expires At/)).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('audience123')).toBeInTheDocument();
  });

  it('shows raw claims when there are more than 10 claims', () => {
    const claims: Record<string, string> = {};
    // Create 11 claims
    for (let i = 0; i < 11; i++) {
      claims[`claim${i}`] = `value${i}`;
    }

    const mockUser = {
      idTokenClaims: {
        name: 'Test User',
        ...claims,
      },
    };

    mockUseContext.mockReturnValue({ ...mockAuthContext, user: mockUser });

    render(<UserAccountTab />);

    expect(screen.getByText('All Claims (Raw)')).toBeInTheDocument();
  });
});