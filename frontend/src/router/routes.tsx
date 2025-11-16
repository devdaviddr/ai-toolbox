import { RootLayout } from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import ProtectedRoute from '../components/ProtectedRoute';
import { lazy } from 'react';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Modules = lazy(() => import('../pages/Modules'));
const ModuleDetail = lazy(() => import('../pages/ModuleDetail'));
const Settings = lazy(() => import('../pages/Settings'));
const Login = lazy(() => import('../pages/Login'));
const NotFound = lazy(() => import('../pages/NotFound'));

export const routes = [
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <Login />
      </ErrorBoundary>
    ),
  },
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <RootLayout>
            <Dashboard />
          </RootLayout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '/modules',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <RootLayout>
            <Modules />
          </RootLayout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '/modules/:id',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <RootLayout>
            <ModuleDetail />
          </RootLayout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '/settings',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <RootLayout>
            <Settings />
          </RootLayout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <RootLayout>
            <NotFound />
          </RootLayout>
        </ProtectedRoute>
      </ErrorBoundary>
    ),
  },
];
