import type { ScanItem } from '../models/types';

export const INITIAL_SCAN_HISTORY: ScanItem[] = [
  {
    id: 'scan-101',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    cropId: 'tomato',
    cropName: 'Tomato',
    diseaseName: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    confidence: 94.2,
    confidenceLevel: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
    summary: 'Concentric dark brown target spots on leaves.'
  },
  {
    id: 'scan-102',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    cropId: 'tomato',
    cropName: 'Tomato',
    diseaseName: 'Healthy Tomato Leaf',
    scientificName: 'Solanum lycopersicum (Healthy)',
    confidence: 97.9,
    confidenceLevel: 'High',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    summary: 'No pathogenic spots detected. Leaf structure healthy.'
  }
];
