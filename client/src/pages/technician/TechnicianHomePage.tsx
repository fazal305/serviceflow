import { UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

import { useJobs, type Job } from '../../api/jobs';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to={`/technician/jobs/${job.id}`}
      className="block rounded-lg border border-border bg-card p-4 transition-colors active:bg-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {job.scheduledTime ?? 'Time TBD'}
          </p>
          <p className="mt-0.5 truncate text-sm text-foreground">{job.customerName ?? job.customerEmail}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {job.serviceCategoryName ?? 'General'} · {job.address}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>
    </Link>
  );
}

export function TechnicianHomePage() {
  const { data: jobs, isPending, isError, refetch } = useJobs();

  const today = todayStr();
  const todaysJobs = jobs?.filter((j) => j.scheduledDate === today) ?? [];
  const upcomingJobs =
    jobs
      ?.filter((j) => j.scheduledDate > today && j.status !== 'WAITING_FOR_APPROVAL')
      .slice(0, 10) ?? [];

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Today's Jobs</h1>
        <UserButton afterSignOutUrl="/" />
      </header>

      {isPending && <LoadingState label="Loading your jobs…" />}
      {isError && <ErrorState message="Couldn't load your jobs." onRetry={() => refetch()} />}

      {jobs && (
        <>
          {todaysJobs.length === 0 ? (
            <EmptyState title="No jobs today" description="Scheduled jobs for today will show up here." />
          ) : (
            <div className="flex flex-col gap-3">
              {todaysJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {upcomingJobs.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Upcoming</h2>
              {upcomingJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
