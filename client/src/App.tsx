import { Route, Routes } from 'react-router-dom';

import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { LandingPage } from './pages/LandingPage';
import { RoleRedirectPage } from './pages/RoleRedirectPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSchedulePage } from './pages/admin/AdminSchedulePage';
import { AdminServiceRequestsPage } from './pages/admin/AdminServiceRequestsPage';
import { AdminTechniciansPage } from './pages/admin/AdminTechniciansPage';
import { CustomerRequestsPage } from './pages/customer/CustomerRequestsPage';
import { NewServiceRequestPage } from './pages/customer/NewServiceRequestPage';
import { JobDetailPage } from './pages/technician/JobDetailPage';
import { TechnicianHomePage } from './pages/technician/TechnicianHomePage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleGate } from './routes/RoleGate';

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
            <Route path="schedule" element={<AdminSchedulePage />} />
            <Route path="technicians" element={<AdminTechniciansPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
          </Route>
        </Route>

        <Route element={<RoleGate role="CUSTOMER" />}>
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<CustomerRequestsPage />} />
            <Route path="requests/new" element={<NewServiceRequestPage />} />
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
