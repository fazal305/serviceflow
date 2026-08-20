import { Link } from 'react-router-dom';

import type { ServiceRequest } from '../api/serviceRequests';
import { StatusBadge } from './StatusBadge';

export function RequestCard({ request }: { request: ServiceRequest }) {
  return (
    <Link
      to={`/customer/requests/${request.id}`}
      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {request.serviceCategoryName ?? 'General request'}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
        {request.technicianName && <span>Technician: {request.technicianName}</span>}
      </div>
    </Link>
  );
}
