export type ServiceRequestStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_APPROVAL'
  | 'QUOTATION_APPROVED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Single source of truth for which status transitions are legal. Every
 * phase that introduces new transitions (scheduling, quotations, payments)
 * extends this map rather than adding scattered status checks elsewhere —
 * so "can X happen from status Y" always has exactly one place to look.
 *
 * Only the transitions this phase's features actually use are enabled;
 * later-phase statuses exist in the type/DB enum already (Section 13) but
 * aren't reachable yet.
 */
const ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  NEW: ['UNDER_REVIEW', 'ASSIGNED', 'CANCELLED'],
  UNDER_REVIEW: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_APPROVAL', 'CANCELLED'],
  WAITING_FOR_APPROVAL: ['QUOTATION_APPROVED', 'CANCELLED'],
  QUOTATION_APPROVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: ServiceRequestStatus, to: ServiceRequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
