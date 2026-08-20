import { SignUp } from '@clerk/clerk-react';

export function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/app" />
    </main>
  );
}
