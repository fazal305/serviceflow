import { SignIn } from '@clerk/clerk-react';

export function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
    </main>
  );
}
