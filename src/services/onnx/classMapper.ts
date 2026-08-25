import type { DiseaseKnowledge } from '../../models/types';
import { DISEASES_KNOWLEDGE_BASE } from '../../data/diseasesData';

export interface ClassMappingEntry {
  index: number;
  className: string;
  databaseId: string;
  displayName: string;
}

export const TOMATO_DISEASE_CLASSES: ClassMappingEntry[] = [
  { index: 0, className: 'Tomato___Bacterial_spot', databaseId: 'tomato-bacterial-spot', displayName: 'Tomato Bacterial Spot' },
  { index: 1, className: 'Tomato___Early_blight', databaseId: 'tomato-early-blight', displayName: 'Tomato Early Blight' },
  { index: 2, className: 'Tomato___Late_blight', databaseId: 'tomato-late-blight', displayName: 'Tomato Late Blight' },
  { index: 3, className: 'Tomato___Leaf_Mold', databaseId: 'tomato-leaf-mold', displayName: 'Tomato Leaf Mold' },
  { index: 4, className: 'Tomato___Septoria_leaf_spot', databaseId: 'tomato-septoria-leaf-spot', displayName: 'Tomato Septoria Leaf Spot' },
  { index: 5, className: 'Tomato___Spider_mites Two-spotted_spider_mite', databaseId: 'tomato-spider-mites', displayName: 'Two-Spotted Spider Mite Damage' },
  { index: 6, className: 'Tomato___Target_Spot', databaseId: 'tomato-target-spot', displayName: 'Tomato Target Spot' },
  { index: 7, className: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', databaseId: 'tomato-yellow-leaf-curl-virus', displayName: 'Tomato Yellow Leaf Curl Virus (TYLCV)' },
  { index: 8, className: 'Tomato___Tomato_mosaic_virus', databaseId: 'tomato-mosaic-virus', displayName: 'Tomato Mosaic Virus (ToMV)' },
  { index: 9, className: 'Tomato___healthy', databaseId: 'tomato-healthy', displayName: 'Healthy Tomato Leaf' }
];

export function mapClassIndexToDisease(classIndex: number): DiseaseKnowledge {
  const entry = TOMATO_DISEASE_CLASSES.find((c) => c.index === classIndex);
  const dbId = entry ? entry.databaseId : 'tomato-healthy';
  return DISEASES_KNOWLEDGE_BASE[dbId] || DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
}
