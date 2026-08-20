import { useMutation } from '@tanstack/react-query';

import { useApi } from './useApi';

export interface ClassificationResult {
  problems: string[];
  possibleCauses: string[];
  suggestedServiceCategoryId: string | null;
  suggestedServiceCategoryName: string | null;
  suggestedTechnicianType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
}

export type ClassifyOutcome =
  | { success: true; data: ClassificationResult }
  | { success: false; reason: string };

export function useClassifyDescription() {
  const api = useApi();
  return useMutation({
    mutationFn: (description: string) =>
      api<ClassifyOutcome>('/ai/classify', {
        method: 'POST',
        body: JSON.stringify({ description }),
      }),
  });
}
