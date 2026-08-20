import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useScheduleRequest } from '../../api/jobs';
import {
  useAssignTechnician,
  useServiceRequests,
  type ServiceRequest,
  type ServiceRequestStatus,
} from '../../api/serviceRequests';
import { useTechnicians } from '../../api/technicians';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { inputClass } from '../../components/Field';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';

const STATUS_OPTIONS: ServiceRequestStatus[] = [
  'NEW',
  'UNDER_REVIEW',
  'ASSIGNED',
  'SCHEDULED',
  'IN_PROGRESS',
  'WAITING_FOR_APPROVAL',
  'QUOTATION_APPROVED',
  'COMPLETED',
  'CANCELLED',
];

const ASSIGNABLE_STATUSES: ServiceRequestStatus[] = ['NEW', 'UNDER_REVIEW'];
const SCHEDULABLE_STATUSES: ServiceRequestStatus[] = ['ASSIGNED'];

export function AdminServiceRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | ''>('');
  const { data: requests, isPending, isError, refetch } = useServiceRequests(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const { data: technicians } = useTechnicians();
  const assignTechnician = useAssignTechnician();
  const scheduleRequest = useScheduleRequest();

  const [assigningRequest, setAssigningRequest] = useState<ServiceRequest | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [schedulingRequest, setSchedulingRequest] = useState<ServiceRequest | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const activeTechnicians = technicians?.filter((t) => t.isActive) ?? [];

  function openAssignModal(request: ServiceRequest) {
    assignTechnician.reset();
    setSelectedTechnicianId('');
    setAssigningRequest(request);
  }

  async function confirmAssign() {
    if (!assigningRequest || !selectedTechnicianId) return;
    await assignTechnician.mutateAsync({
      requestId: assigningRequest.id,
      technicianId: selectedTechnicianId,
    });
    setAssigningRequest(null);
  }

  function openScheduleModal(request: ServiceRequest) {
    scheduleRequest.reset();
    setScheduledDate(request.preferredDate ?? '');
    setScheduledTime(request.preferredTime ?? '');
    setSchedulingRequest(request);
  }

  async function confirmSchedule() {
    if (!schedulingRequest || !scheduledDate) return;
    await scheduleRequest.mutateAsync({
      requestId: schedulingRequest.id,
      scheduledDate,
      scheduledTime: scheduledTime || null,
    });
    setSchedulingRequest(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Service Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review requests and assign technicians.</p>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as ServiceRequestStatus | '')}
        className={`${inputClass} max-w-xs`}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll('_', ' ')}
          </option>
        ))}
      </select>

      {isPending && <LoadingState label="Loading service requests…" />}
      {isError && <ErrorState message="Couldn't load service requests." onRetry={() => refetch()} />}

      {requests && requests.length === 0 && (
        <EmptyState title="No service requests" description="Requests submitted by customers will appear here." />
      )}

      {requests && requests.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Technician</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-2.5">
                    <p className="text-foreground">{request.customerName ?? request.customerEmail}</p>
                    <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                      {request.description}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{request.serviceCategoryName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{request.priority}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{request.technicianName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {ASSIGNABLE_STATUSES.includes(request.status) && (
                      <button
                        type="button"
                        onClick={() => openAssignModal(request)}
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        Assign
                      </button>
                    )}
                    {SCHEDULABLE_STATUSES.includes(request.status) && (
                      <button
                        type="button"
                        onClick={() => openScheduleModal(request)}
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        Schedule
                      </button>
                    )}
                    <Link
                      to={`/admin/service-requests/${request.id}`}
                      className="ml-2 text-xs font-medium text-accent hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!assigningRequest} onClose={() => setAssigningRequest(null)} title="Assign technician">
        {assigningRequest && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{assigningRequest.description}</p>

            {activeTechnicians.length === 0 ? (
              <p className="text-sm text-destructive">No active technicians available. Add one first.</p>
            ) : (
              <select
                value={selectedTechnicianId}
                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                className={inputClass}
                aria-label="Select technician"
              >
                <option value="">Select a technician…</option>
                {activeTechnicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.fullName ?? tech.email}
                    {tech.serviceCategoryName ? ` — ${tech.serviceCategoryName}` : ''}
                  </option>
                ))}
              </select>
            )}

            {assignTechnician.isError && (
              <p role="alert" className="text-sm text-destructive">
                {assignTechnician.error instanceof Error ? assignTechnician.error.message : 'Failed to assign'}
              </p>
            )}

            <button
              type="button"
              onClick={confirmAssign}
              disabled={!selectedTechnicianId || assignTechnician.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {assignTechnician.isPending ? 'Assigning…' : 'Confirm assignment'}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!schedulingRequest} onClose={() => setSchedulingRequest(null)} title="Schedule job">
        {schedulingRequest && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {schedulingRequest.description}
              {schedulingRequest.technicianName && ` — assigned to ${schedulingRequest.technicianName}`}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Date
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Time
                <input
                  type="text"
                  placeholder="e.g. Morning"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            {scheduleRequest.isError && (
              <p role="alert" className="text-sm text-destructive">
                {scheduleRequest.error instanceof Error ? scheduleRequest.error.message : 'Failed to schedule'}
              </p>
            )}

            <button
              type="button"
              onClick={confirmSchedule}
              disabled={!scheduledDate || scheduleRequest.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {scheduleRequest.isPending ? 'Scheduling…' : 'Confirm schedule'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
