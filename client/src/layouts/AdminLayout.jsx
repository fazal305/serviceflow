import { UserButton } from '@clerk/clerk-react';
import { NavLink, Outlet } from 'react-router-dom';

import { NotificationBell } from '../components/NotificationBell';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/service-requests', label: 'Service Requests' },
  { to: '/admin/schedule', label: 'Schedule' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/technicians', label: 'Technicians' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/activity', label: 'Activity' },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-56 flex-shrink-0 border-r border-border bg-card px-4 py-6 sm:block">
        <p className="px-2 text-lg font-semibold tracking-tight text-foreground">ServiceFlow</p>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 sm:hidden">
          <p className="text-base font-semibold text-foreground">ServiceFlow</p>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <header className="hidden items-center justify-end gap-2 border-b border-border px-6 py-3 sm:flex">
          <NotificationBell />
          <UserButton afterSignOutUrl="/" />
        </header>

        <main className="mx-auto max-w-5xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
