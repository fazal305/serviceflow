import { useEffect, useState } from 'react';

import { useCustomers } from '../../api/customers';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { inputClass } from '../../components/Field';
import { LoadingState } from '../../components/LoadingState';

export function AdminCustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: customers, isPending, isError, refetch } = useCustomers(search || undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer accounts are created via sign-up — this is a read-only directory.
        </p>
      </div>

      <input
        type="search"
        placeholder="Search by name or email…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className={`${inputClass} max-w-sm`}
        aria-label="Search customers"
      />

      {isPending && <LoadingState label="Loading customers…" />}
      {isError && <ErrorState message="Couldn't load customers." onRetry={() => refetch()} />}

      {customers && customers.length === 0 && (
        <EmptyState
          title="No customers found"
          description={search ? 'Try a different search term.' : 'Customers appear here once they sign up.'}
        />
      )}

      {customers && customers.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
                <th className="px-4 py-2.5 font-medium">Address</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-foreground">{customer.fullName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{customer.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{customer.phone ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{customer.address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
