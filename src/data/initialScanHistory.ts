import type { ScanItem } from '../models/types';

export const INITIAL_SCAN_HISTORY: ScanItem[] = [
  {
    id: 'scan-101',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    cropId: 'tomato',
    cropName: 'Tomato',
    diseaseName: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    severity: 'Moderate',
    confidence: 94.2,
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
    summary: 'Concentric dark brown target spots detected on lower leaves.',
    recommendationSnippet: 'Prune affected leaves and apply Copper Oxychloride spray.',
    yoloBoundingBox: { x: 18, y: 22, width: 62, height: 58, label: 'Tomato Leaf', confidence: 0.96 },
    limeFeatures: [
      { id: 'f1', x: 35, y: 40, radius: 12, importanceScore: 0.88, type: 'positive', label: 'Concentric Ring Lesion' },
      { id: 'f2', x: 50, y: 55, radius: 10, importanceScore: 0.79, type: 'positive', label: 'Chlorotic Halo' }
    ]
  },
  {
    id: 'scan-102',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    cropId: 'potato',
    cropName: 'Potato',
    diseaseName: 'Healthy Potato Foliage',
    scientificName: 'Solanum tuberosum (Healthy)',
    severity: 'Healthy',
    confidence: 97.9,
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    summary: 'No pathogenic spots detected. Leaf structure healthy.',
    recommendationSnippet: 'Maintain current weeding and balanced nitrogen watering regime.',
    yoloBoundingBox: { x: 15, y: 15, width: 70, height: 70, label: 'Potato Leaf', confidence: 0.98 }
  },
  {
    id: 'scan-103',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    cropId: 'maize',
    cropName: 'Maize (Corn)',
    diseaseName: 'Maize Common Rust',
    scientificName: 'Puccinia sorghi',
    severity: 'Mild',
    confidence: 91.5,
    imageUrl: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=600&q=80',
    summary: 'Small cinnamon-brown pustules on middle leaves.',
    recommendationSnippet: 'Apply Bacillus subtilis bio-fungicide and monitor field moisture.',
    yoloBoundingBox: { x: 20, y: 20, width: 60, height: 60, label: 'Maize Leaf', confidence: 0.94 }
  }
];
