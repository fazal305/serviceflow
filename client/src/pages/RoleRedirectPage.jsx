import { Navigate, useLocation } from 'react-router-dom';

import { useMe } from '../api/me';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';

const ROLE_HOME = {
  ADMIN: '/admin',
  TECHNICIAN: '/technician',
  CUSTOMER: '/customer',
};

export function RoleRedirectPage() {
  const { data: me, isPending, isError, refetch } = useMe();
  const location = useLocation();
  const accessDenied = Boolean(location.state?.accessDenied);

  if (isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <LoadingState label="Setting up your account…" />
      </main>
    );
  }

  if (isError || !me) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <ErrorState message="Couldn't load your account." onRetry={() => refetch()} />
      </main>
    );
  }

  const homePath = ROLE_HOME[me.role] ?? '/';

  // RoleGate sends people here with accessDenied when they hit a page their
  // role doesn't allow. Surface that instead of silently bouncing them
  // straight through to their own home page — an immediate <Navigate>
  // would redirect before the message ever renders.
  if (accessDenied) {
    return (
      <main className="flex min-h-svh items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">You don't have access to that page.</p>
          <button
            type="button"
            onClick={() => window.location.assign(homePath)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Go to my dashboard
          </button>
        </div>
      </main>
    );
  }

  return <Navigate to={homePath} replace />;
}
