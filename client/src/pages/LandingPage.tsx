import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate, Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <>
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
      <SignedOut>
        <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              ServiceFlow
            </h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Service request tracking, technician dispatch, and invoicing —
              in one place.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/sign-in"
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        </main>
      </SignedOut>
    </>
  );
}
