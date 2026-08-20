import { UserButton } from '@clerk/clerk-react';

import { useMe } from '../api/me';

const ROLE_MESSAGE: Record<string, string> = {
  ADMIN: 'Admin tools (customers, technicians, scheduling, reports) arrive in Phase 2+.',
  TECHNICIAN: "Your assigned jobs and today's schedule arrive in Phase 3.",
  CUSTOMER: 'Service requests and your service history arrive in Phase 2+.',
};

export function DashboardPage() {
  const { data: me, isLoading, isError, error } = useMe();

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          ServiceFlow
        </h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Couldn't load your account: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}

        {me && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="text-lg font-medium text-foreground">{me.email}</p>
            <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {me.role}
            </span>
            <p className="pt-3 text-sm text-muted-foreground">
              {ROLE_MESSAGE[me.role]}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
