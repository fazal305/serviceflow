import { useState } from 'react';

import { useServiceCategories } from '../../api/serviceCategories';
import { useCreateTechnician, useTechnicians } from '../../api/technicians';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Field, inputClass } from '../../components/Field';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';

export function AdminTechniciansPage() {
  const { data: technicians, isPending, isError, refetch } = useTechnicians();
  const { data: categories } = useServiceCategories();
  const createTechnician = useCreateTechnician();

  const [modalOpen, setModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  function openCreateModal() {
    createTechnician.reset();
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const firstName = String(form.get('firstName'));
    const lastName = String(form.get('lastName'));
    const serviceCategoryId = String(form.get('serviceCategoryId')) || null;

    const result = await createTechnician.mutateAsync({ email, firstName, lastName, serviceCategoryId });
    setModalOpen(false);
    setCreatedCredentials({ email, password: result.tempPassword });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Technicians</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your field technician roster.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Add technician
        </button>
      </div>

      {isPending && <LoadingState label="Loading technicians…" />}
      {isError && <ErrorState message="Couldn't load technicians." onRetry={() => refetch()} />}

      {technicians && technicians.length === 0 && (
        <EmptyState title="No technicians yet" description="Add your first technician to start assigning jobs." />
      )}

      {technicians && technicians.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Specialty</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => (
                <tr key={tech.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-foreground">{tech.fullName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tech.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{tech.serviceCategoryName ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tech.isActive ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tech.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add technician">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="First name" htmlFor="firstName">
            <input id="firstName" name="firstName" required className={inputClass} />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <input id="lastName" name="lastName" required className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" required className={inputClass} />
          </Field>
          <Field label="Specialty" htmlFor="serviceCategoryId">
            <select id="serviceCategoryId" name="serviceCategoryId" className={inputClass}>
              <option value="">No specific specialty</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          {createTechnician.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createTechnician.error instanceof Error ? createTechnician.error.message : 'Failed to create technician'}
            </p>
          )}

          <button
            type="submit"
            disabled={createTechnician.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {createTechnician.isPending ? 'Creating…' : 'Create technician account'}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        title="Technician account created"
      >
        {createdCredentials && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Share these sign-in details with the technician directly — they won't be shown again.
              There's no email delivery configured yet, so this is the only place this password appears.
            </p>
            <div className="rounded-md border border-border bg-background p-3 font-mono text-sm">
              <p>{createdCredentials.email}</p>
              <p>{createdCredentials.password}</p>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
