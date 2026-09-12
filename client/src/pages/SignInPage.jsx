import { SignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export function SignInPage() {
  const location = useLocation();
  const sessionExpired = Boolean(location.state?.sessionExpired);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
      {sessionExpired && (
        <p className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          Your session has expired — please sign in again.
        </p>
      )}
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/app" />
    </main>
  );
}
