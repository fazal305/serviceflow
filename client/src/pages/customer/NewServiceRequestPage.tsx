import { type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useServiceCategories } from '../../api/serviceCategories';
import { useCreateServiceRequest, type Priority } from '../../api/serviceRequests';
import { Field, inputClass } from '../../components/Field';

export function NewServiceRequestPage() {
  const navigate = useNavigate();
  const { data: categories } = useServiceCategories();
  const createRequest = useCreateServiceRequest();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    await createRequest.mutateAsync({
      serviceCategoryId: String(form.get('serviceCategoryId')) || null,
      description: String(form.get('description')),
      priority: String(form.get('priority')) as Priority,
      preferredDate: String(form.get('preferredDate')) || null,
      preferredTime: String(form.get('preferredTime')) || null,
      address: String(form.get('address')),
      contactPhone: String(form.get('contactPhone')) || null,
    });

    navigate('/customer');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">New service request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe the problem and we'll get a technician assigned.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <Field label="Service category" htmlFor="serviceCategoryId">
          <select id="serviceCategoryId" name="serviceCategoryId" className={inputClass}>
            <option value="">Not sure / other</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Describe the problem" htmlFor="description">
          <textarea
            id="description"
            name="description"
            required
            minLength={10}
            rows={4}
            placeholder="What's happening? Include as much detail as you can."
            className={inputClass}
          />
        </Field>

        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue="MEDIUM" className={inputClass}>
            <option value="LOW">Low — no rush</option>
            <option value="MEDIUM">Medium — within a few days</option>
            <option value="HIGH">High — urgent</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Preferred date" htmlFor="preferredDate">
            <input id="preferredDate" name="preferredDate" type="date" className={inputClass} />
          </Field>
          <Field label="Preferred time" htmlFor="preferredTime">
            <input
              id="preferredTime"
              name="preferredTime"
              type="text"
              placeholder="e.g. Morning"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Service address" htmlFor="address">
          <input id="address" name="address" required minLength={5} className={inputClass} />
        </Field>

        <Field label="Contact phone" htmlFor="contactPhone">
          <input id="contactPhone" name="contactPhone" type="tel" className={inputClass} />
        </Field>

        {createRequest.isError && (
          <p role="alert" className="text-sm text-destructive">
            {createRequest.error instanceof Error ? createRequest.error.message : 'Failed to submit request'}
          </p>
        )}

        <button
          type="submit"
          disabled={createRequest.isPending}
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {createRequest.isPending ? 'Submitting…' : 'Submit request'}
        </button>
      </form>
    </div>
  );
}
