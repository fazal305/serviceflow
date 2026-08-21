import { useAuth } from '@clerk/clerk-react';
import { Navigate, Outlet } from 'react-router-dom';

import { useRealtimeSync } from '../hooks/useRealtimeSync';

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

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
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
