import { useAuth } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useRealtimeSync } from '../hooks/useRealtimeSync';

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  // Mounted once here rather than in each layout (admin/customer/
  // technician) so every authenticated role gets realtime sync from a
  // single integration point instead of three separate ones.
  useRealtimeSync();

  if (!isLoaded) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </main>
    );
  }

  if (!isSignedIn) {
    // Reaching this guard means a protected route was requested without a
    // valid session (as opposed to landing on /sign-in directly), so the
    // sign-in page can tell the user their session expired rather than
    // silently showing a plain sign-in form.
    return <Navigate to="/sign-in" replace state={{ sessionExpired: true, from: location.pathname }} />;
  }

  return <Outlet />;
}
