import { useState, useEffect } from 'react';
import type { ScanItem, FullAnalysisResult } from '../models/types';
import { INITIAL_SCAN_HISTORY } from '../data/initialScanHistory';

const STORAGE_KEY = 'agrivision_scan_history_v1';

export const useScanHistory = () => {
  const [scans, setScans] = useState<ScanItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load scan history from localStorage:', e);
    }
    return INITIAL_SCAN_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    } catch (e) {
      console.error('Failed to save scan history to localStorage:', e);
    }
  }, [scans]);

  const addScanFromResult = (result: FullAnalysisResult): ScanItem => {
    const newScan: ScanItem = {
      id: result.scanId,
      timestamp: result.timestamp,
      cropId: result.crop.id,
      cropName: result.crop.name,
      diseaseName: result.disease.name,
      scientificName: result.disease.scientificName,
      severity: result.disease.severity,
      confidence: result.disease.confidence,
      imageUrl: result.imageUrl,
      summary: result.disease.description.slice(0, 100) + '...',
      recommendationSnippet: result.disease.immediateAction[0] || 'Prune affected leaves.',
      yoloBoundingBox: result.yoloBoundingBox,
      limeFeatures: result.limeFeatures,
      fullResult: result
    };

    setScans((prev) => [newScan, ...prev]);
    return newScan;
  };

  const deleteScan = (scanId: string) => {
    setScans((prev) => prev.filter((s) => s.id !== scanId));
  };

  const clearHistory = () => {
    setScans([]);
  };

  return {
    scans,
    addScanFromResult,
    deleteScan,
    clearHistory
  };
};
