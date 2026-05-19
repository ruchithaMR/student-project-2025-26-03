import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import DashboardLayout from '../components/feature/DashboardLayout';

// Lazy load pages
const HomePage = lazy(() => import('../pages/home/page'));
const LoginPage = lazy(() => import('../pages/login/page'));
const SignupPage = lazy(() => import('../pages/signup/page'));
const DashboardPage = lazy(() => import('../pages/dashboard/page'));
const VerifyTextPage = lazy(() => import('../pages/verify-text/page'));
const VerifyURLPage = lazy(() => import('../pages/verify-url/page'));
const VerifyImagePage = lazy(() => import('../pages/verify-image/page'));
const VerifyClaimPage = lazy(() => import('../pages/verify-claim/page'));
const SourceCredibilityPage = lazy(() => import('../pages/source-credibility/page'));
const ResultsPage = lazy(() => import('../pages/results/page'));
const HistoryPage = lazy(() => import('../pages/history/page'));
const FeedbackPage = lazy(() => import('../pages/feedback/page'));
const AnalyticsPage = lazy(() => import('../pages/analytics/page'));
const AdminPage = lazy(() => import('../pages/admin/page'));
const ModelInsightsPage = lazy(() => import('../pages/model-insights/page'));
const AboutPage = lazy(() => import('../pages/about/page'));
const ProfilePage = lazy(() => import('../pages/profile/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'verify-text',
        element: <VerifyTextPage />,
      },
      {
        path: 'verify-url',
        element: <VerifyURLPage />,
      },
      {
        path: 'verify-image',
        element: <VerifyImagePage />,
      },
      {
        path: 'verify-claim',
        element: <VerifyClaimPage />,
      },
      {
        path: 'source-credibility',
        element: <SourceCredibilityPage />,
      },
      {
        path: 'results',
        element: <ResultsPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'feedback',
        element: <FeedbackPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'admin',
        element: <AdminPage />,
      },
      {
        path: 'model-insights',
        element: <ModelInsightsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
