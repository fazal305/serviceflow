import { type FormEvent, useState } from 'react';

import { useMe, useUpdateProfile } from '../../api/me';
import { ErrorState } from '../../components/ErrorState';
import { Field, inputClass } from '../../components/Field';
import { LoadingState } from '../../components/LoadingState';

export function CustomerProfilePage() {
  const { data: me, isPending, isError, refetch } = useMe();
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);

  if (isPending) return <LoadingState label="Loading profile…" />;
  if (isError || !me) return <ErrorState message="Couldn't load your profile." onRetry={() => refetch()} />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaved(false);
    await updateProfile.mutateAsync({
      fullName: String(form.get('fullName')).trim() || null,
      phone: String(form.get('phone')).trim() || null,
      address: String(form.get('address')).trim() || null,
    });
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your contact details.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <Field label="Email" htmlFor="email">
          <input id="email" value={me!.email} disabled className={`${inputClass} opacity-60`} />
        </Field>
        <Field label="Full name" htmlFor="fullName">
          <input id="fullName" name="fullName" defaultValue={me!.fullName ?? ''} className={inputClass} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input id="phone" name="phone" type="tel" defaultValue={me!.phone ?? ''} className={inputClass} />
        </Field>
        <Field label="Default address" htmlFor="address">
          <input id="address" name="address" defaultValue={me!.address ?? ''} className={inputClass} />
        </Field>

        {updateProfile.isError && (
          <p role="alert" className="text-sm text-destructive">
            Failed to save changes. Please try again.
          </p>
        )}
        {saved && !updateProfile.isPending && <p className="text-sm text-success">Saved.</p>}

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {updateProfile.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
