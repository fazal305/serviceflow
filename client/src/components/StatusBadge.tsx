import type { ServiceRequestStatus } from '../api/serviceRequests';

const STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  NEW: 'bg-muted text-muted-foreground',
  UNDER_REVIEW: 'bg-warning/15 text-warning',
  ASSIGNED: 'bg-accent/15 text-accent',
  SCHEDULED: 'bg-accent/15 text-accent',
  IN_PROGRESS: 'bg-accent/15 text-accent',
  WAITING_FOR_APPROVAL: 'bg-warning/15 text-warning',
  QUOTATION_APPROVED: 'bg-success/15 text-success',
  COMPLETED: 'bg-success/15 text-success',
  CANCELLED: 'bg-destructive/15 text-destructive',
};

const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under review',
  ASSIGNED: 'Assigned',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  WAITING_FOR_APPROVAL: 'Awaiting approval',
  QUOTATION_APPROVED: 'Quotation approved',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
