import { UserButton } from '@clerk/clerk-react';

import { useMe } from '../api/me';

export function TechnicianHomePage() {
  const { data: me } = useMe();

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">ServiceFlow</h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="text-lg font-medium text-foreground">{me?.email}</p>
        <p className="pt-3 text-sm text-muted-foreground">
          Your assigned jobs and today's schedule arrive in Phase 3 — the mobile-first
          technician workflow (start job, add notes/parts/photos, complete job).
        </p>
      </section>
    </main>
  );
}
