import { RootLayout } from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
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
        <RootLayout>
          <Dashboard />
        </RootLayout>
      </ErrorBoundary>
    ),
  },
  {
    path: '/modules',
    element: (
      <ErrorBoundary>
        <RootLayout>
          <Modules />
        </RootLayout>
      </ErrorBoundary>
    ),
  },
  {
    path: '/modules/:id',
    element: (
      <ErrorBoundary>
        <RootLayout>
          <ModuleDetail />
        </RootLayout>
      </ErrorBoundary>
    ),
  },
  {
    path: '/settings',
    element: (
      <ErrorBoundary>
        <RootLayout>
          <Settings />
        </RootLayout>
      </ErrorBoundary>
    ),
  },
  {
    path: '*',
    element: (
      <ErrorBoundary>
        <RootLayout>
          <NotFound />
        </RootLayout>
      </ErrorBoundary>
    ),
  },
];
