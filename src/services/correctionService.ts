import type {
  SaveCorrectionPayload,
  LeafCorrectionRecord,
  CorrectionStatsResponse
} from '../models/correctionTypes';

export interface SubmitCorrectionResult {
  success: boolean;
  message?: string;
  record?: LeafCorrectionRecord;
  error?: string;
  details?: string;
  duplicate?: boolean;
  diagnostics?: {
    isCloudConfigured: boolean;
    isPersistent?: boolean;
    isVercel?: boolean;
    persistenceWarning?: string | null;
    mode: string;
    localStorageLocation?: {
      manifest: string;
      images: string;
    };
    missingCredentials: string[];
  };
}

/**
 * Sends a corrected tomato leaf disease diagnosis to the backend API.
 */
export async function submitCorrection(
  payload: SaveCorrectionPayload
): Promise<SubmitCorrectionResult> {
  try {
    const res = await fetch('/api/corrections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}: Failed to save correction.`,
        details: data.details,
        duplicate: data.duplicate,
        diagnostics: data.diagnostics
      };
    }

    return {
      success: true,
      message: data.message || 'Correction saved successfully.',
      record: data.record,
      diagnostics: data.diagnostics
    };
  } catch (err) {
    console.error('submitCorrection network error:', err);
    return {
      success: false,
      error: 'Network error or service unavailable. Please check your connection.',
      details: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Fetches recent corrections and summary statistics.
 */
export async function fetchCorrectionStats(): Promise<{
  success: boolean;
  data?: CorrectionStatsResponse;
  error?: string;
}> {
  try {
    const res = await fetch('/api/corrections');
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to fetch correction stats.' };
    }
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error'
    };
  }
}

/**
 * Triggers direct browser download of the corrected dataset.
 */
export function downloadDatasetExport(format: 'json' | 'csv' = 'json'): void {
  const url = `/api/corrections/export?format=${format}`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `agrivision_tomato_corrections_${Date.now()}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
