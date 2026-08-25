import type { DiseaseInfo } from '../../models/types';
import { DISEASES_DATABASE } from '../../data/diseasesData';

export interface ClassMappingEntry {
  index: number;
  className: string;
  databaseId: string;
  isHealthy: boolean;
}

export const TOMATO_DISEASE_CLASSES: ClassMappingEntry[] = [
  { index: 0, className: 'Tomato___Bacterial_spot', databaseId: 'tomato-bacterial-spot', isHealthy: false },
  { index: 1, className: 'Tomato___Early_blight', databaseId: 'tomato-early-blight', isHealthy: false },
  { index: 2, className: 'Tomato___Late_blight', databaseId: 'tomato-late-blight', isHealthy: false },
  { index: 3, className: 'Tomato___Leaf_Mold', databaseId: 'tomato-leaf-mold', isHealthy: false },
  { index: 4, className: 'Tomato___Septoria_leaf_spot', databaseId: 'tomato-septoria-leaf-spot', isHealthy: false },
  { index: 5, className: 'Tomato___Spider_mites Two-spotted_spider_mite', databaseId: 'tomato-spider-mites', isHealthy: false },
  { index: 6, className: 'Tomato___Target_Spot', databaseId: 'tomato-target-spot', isHealthy: false },
  { index: 7, className: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', databaseId: 'tomato-yellow-leaf-curl-virus', isHealthy: false },
  { index: 8, className: 'Tomato___Tomato_mosaic_virus', databaseId: 'tomato-mosaic-virus', isHealthy: false },
  { index: 9, className: 'Tomato___healthy', databaseId: 'tomato-healthy', isHealthy: true }
];

export function mapClassIndexToDisease(classIndex: number): DiseaseInfo {
  const entry = TOMATO_DISEASE_CLASSES.find((c) => c.index === classIndex);
  const dbId = entry ? entry.databaseId : 'tomato-early-blight';
  return DISEASES_DATABASE[dbId] || DISEASES_DATABASE['tomato-early-blight'];
}
