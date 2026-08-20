import { UserButton } from '@clerk/clerk-react';
import { NavLink, Outlet } from 'react-router-dom';

export function CustomerLayout() {
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <p className="text-lg font-semibold tracking-tight text-foreground">ServiceFlow</p>
        <nav className="flex items-center gap-4">
          <NavLink
            to="/customer"
            end
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`
            }
          >
            My requests
          </NavLink>
          <NavLink
            to="/customer/requests/new"
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`
            }
          >
            New request
          </NavLink>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
