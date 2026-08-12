import type { Crop } from '../models/types';

export const CROPS_DATA: Crop[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    icon: '🍅',
    accentColor: '#ef4444',
    description: 'Primary baseline crop for 2025 IEEE Access multi-stage research paper benchmark.',
    supported: true,
    commonDiseasesCount: 5,
    sampleImageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'potato',
    name: 'Potato',
    scientificName: 'Solanum tuberosum',
    icon: '🥔',
    accentColor: '#d97706',
    description: 'Staple tuber crop susceptible to early blight and late blight lesions.',
    supported: true,
    commonDiseasesCount: 4,
    sampleImageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    scientificName: 'Zea mays',
    icon: '🌽',
    accentColor: '#eab308',
    description: 'High-yield grain crop vulnerable to common rust and northern corn leaf blight.',
    supported: true,
    commonDiseasesCount: 3,
    sampleImageUrl: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'rice',
    name: 'Rice',
    scientificName: 'Oryza sativa',
    icon: '🌾',
    accentColor: '#84cc16',
    description: 'Essential staple crop affected by leaf blast and bacterial leaf streak.',
    supported: true,
    commonDiseasesCount: 4,
    sampleImageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'banana',
    name: 'Banana',
    scientificName: 'Musa acuminata',
    icon: '🍌',
    accentColor: '#facc15',
    description: 'Tropical fruit plant prone to Black Sigatoka and Panama wilt disease.',
    supported: true,
    commonDiseasesCount: 3,
    sampleImageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'chilli',
    name: 'Chilli Pepper',
    scientificName: 'Capsicum annuum',
    icon: '🌶️',
    accentColor: '#dc2626',
    description: 'Spice crop susceptible to anthracnose and leaf curl viruses.',
    supported: true,
    commonDiseasesCount: 4,
    sampleImageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80'
  }
];

export const getCropById = (id: string): Crop => {
  return CROPS_DATA.find((c) => c.id === id) || CROPS_DATA[0];
};
