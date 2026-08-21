import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAddJobNote, useAddJobPart, useCompleteJob, useJob, useStartJob } from '../../api/jobs';
import { ErrorState } from '../../components/ErrorState';
import { inputClass } from '../../components/Field';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';

export function JobDetailPage() {
  const { id } = useParams();
  const { data: job, isPending, isError, refetch } = useJob(id);
  const startJob = useStartJob();
  const completeJob = useCompleteJob();
  const addNote = useAddJobNote(id ?? '');
  const addPart = useAddJobPart(id ?? '');

  const [noteText, setNoteText] = useState('');

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addNote.mutateAsync(noteText.trim());
    setNoteText('');
  }

  async function handleAddPart(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name')).trim();
    const quantity = Number(form.get('quantity'));
    const unitCostRaw = String(form.get('unitCost'));
    if (!name || !quantity) return;

    await addPart.mutateAsync({
      name,
      quantity,
      unitCost: unitCostRaw ? Number(unitCostRaw) : null,
    });
    e.currentTarget.reset();
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-md px-4 py-6">
        <LoadingState label="Loading job…" />
      </main>
    );
  }

  if (isError || !job) {
    return (
      <main className="mx-auto max-w-md px-4 py-6">
        <ErrorState message="Couldn't load this job." onRetry={() => refetch()} />
      </main>
    );
  }

  const canStart = job.status === 'SCHEDULED';
  const canComplete = job.status === 'IN_PROGRESS';

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link to="/technician" className="text-sm font-medium text-accent">
          ← Today's Jobs
        </Link>
        <StatusBadge status={job.status} />
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <p className="text-lg font-semibold text-foreground">{job.customerName ?? job.customerEmail}</p>
        {job.contactPhone && (
          <a href={`tel:${job.contactPhone}`} className="mt-1 block text-sm text-accent">
            {job.contactPhone}
          </a>
        )}
        <p className="mt-2 text-sm text-foreground">{job.address}</p>
        <p className="mt-3 text-sm text-muted-foreground">{job.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {job.serviceCategoryName ?? 'General'} · {job.priority} priority · Scheduled{' '}
          {job.scheduledDate}
          {job.scheduledTime && ` at ${job.scheduledTime}`}
        </p>
      </section>

      <div className="flex flex-col gap-3">
        {canStart && (
          <button
            type="button"
            onClick={() => startJob.mutate(job.id)}
            disabled={startJob.isPending}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {startJob.isPending ? 'Starting…' : 'Start Job'}
          </button>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={() => completeJob.mutate(job.id)}
            disabled={completeJob.isPending}
            className="w-full rounded-md bg-success px-4 py-3 text-sm font-semibold text-success-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {completeJob.isPending ? 'Completing…' : 'Complete Job'}
          </button>
        )}
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Notes</h2>
        {job.notes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {job.notes.map((n) => (
              <li key={n.id} className="rounded-md bg-muted p-2.5 text-sm text-foreground">
                {n.note}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note…"
            className={inputClass}
            aria-label="New note"
          />
          <button
            type="submit"
            disabled={addNote.isPending || !noteText.trim()}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Add
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Parts used</h2>
        {job.parts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No parts logged yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {job.parts.map((p) => (
              <li key={p.id} className="flex justify-between text-sm text-foreground">
                <span>
                  {p.name} × {p.quantity}
                </span>
                {p.unitCost && <span className="text-muted-foreground">${p.unitCost} each</span>}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddPart} className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <input name="name" placeholder="Part name" required className={`${inputClass} col-span-1`} />
            <input
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
              required
              className={inputClass}
            />
            <input name="unitCost" type="number" min="0" step="0.01" placeholder="Cost" className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={addPart.isPending}
            className="self-start rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            Add part
          </button>
        </form>
      </section>
    </main>
  );
}
