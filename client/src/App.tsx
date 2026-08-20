import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { LandingPage } from './pages/LandingPage';
import { RoleRedirectPage } from './pages/RoleRedirectPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminInvoicesPage } from './pages/admin/AdminInvoicesPage';
import { AdminRequestDetailPage } from './pages/admin/AdminRequestDetailPage';
import { AdminSchedulePage } from './pages/admin/AdminSchedulePage';
import { AdminServiceRequestsPage } from './pages/admin/AdminServiceRequestsPage';
import { AdminTechniciansPage } from './pages/admin/AdminTechniciansPage';
import { CustomerInvoicesPage } from './pages/customer/CustomerInvoicesPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { CustomerRequestDetailPage } from './pages/customer/CustomerRequestDetailPage';
import { CustomerRequestsPage } from './pages/customer/CustomerRequestsPage';
import { CustomerServiceHistoryPage } from './pages/customer/CustomerServiceHistoryPage';
import { NewServiceRequestPage } from './pages/customer/NewServiceRequestPage';
import { JobDetailPage } from './pages/technician/JobDetailPage';
import { TechnicianHomePage } from './pages/technician/TechnicianHomePage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleGate } from './routes/RoleGate';
import { LoadingState } from './components/LoadingState';

// Recharts (and its d3 dependencies) is only needed on this one admin page —
// lazy-loading it keeps that weight out of the bundle every customer and
// technician downloads on first load.
const AdminReportsPage = lazy(() =>
  import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })),
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<RoleRedirectPage />} />

        <Route element={<RoleGate role="ADMIN" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="service-requests" element={<AdminServiceRequestsPage />} />
            <Route path="service-requests/:id" element={<AdminRequestDetailPage />} />
            <Route path="schedule" element={<AdminSchedulePage />} />
            <Route path="invoices" element={<AdminInvoicesPage />} />
            <Route path="technicians" element={<AdminTechniciansPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route
              path="reports"
              element={
                <Suspense fallback={<LoadingState label="Loading reports…" />}>
                  <AdminReportsPage />
                </Suspense>
              }
            />
            <Route path="activity" element={<AdminActivityPage />} />
          </Route>
        </Route>

        <Route element={<RoleGate role="CUSTOMER" />}>
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<CustomerRequestsPage />} />
            <Route path="history" element={<CustomerServiceHistoryPage />} />
            <Route path="requests/new" element={<NewServiceRequestPage />} />
            <Route path="requests/:id" element={<CustomerRequestDetailPage />} />
            <Route path="invoices" element={<CustomerInvoicesPage />} />
            <Route path="profile" element={<CustomerProfilePage />} />
          </Route>
        </Route>

        <Route element={<RoleGate role="TECHNICIAN" />}>
          <Route path="/technician" element={<TechnicianHomePage />} />
          <Route path="/technician/jobs/:id" element={<JobDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
