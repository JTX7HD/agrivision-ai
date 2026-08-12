import type { DiseaseInfo, CropId } from '../models/types';

export const DISEASES_DATABASE: Record<string, DiseaseInfo> = {
  'tomato-early-blight': {
    id: 'tomato-early-blight',
    cropId: 'tomato',
    name: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    severity: 'Moderate',
    confidence: 94.2,
    description: 'A common fungal disease causing dark brown concentric spots ("bullseye" target pattern) on older lower leaves, eventually causing defoliation.',
    symptoms: [
      'Concentric dark brown to black leaf spots with yellow halos',
      'Lower/older leaves affected first',
      'Leaves turn yellow, dry up, and drop prematurely',
      'Target-like ring pattern visible inside lesions'
    ],
    immediateAction: [
      'Prune and isolate severely infected lower leaves immediately',
      'Avoid overhead irrigation to keep foliage dry',
      'Sterilize pruning tools with 70% alcohol between cuts'
    ],
    prevention: [
      'Practice 3-year crop rotation with non-solanaceous crops',
      'Apply organic mulch (straw or wood chips) to prevent splash dispersal from soil',
      'Maintain wide plant spacing (60 cm) for air circulation',
      'Plant disease-resistant hybrid varieties'
    ],
    biologicalControl: [
      'Spray Trichoderma viride or Bacillus subtilis bio-fungicides every 7-10 days.',
      'Neem oil spray (0.5% concentration) to inhibit spore germination.'
    ],
    chemicalControl: [
      'Copper oxychloride 50% WP @ 2.5g/L water',
      'Mancozeb 75% WP @ 2g/L water as protective spray'
    ],
    researchPaperReference: '2025 IEEE Access Tomato Disease Benchmark Dataset #TB-2025-04'
  },

  'tomato-late-blight': {
    id: 'tomato-late-blight',
    cropId: 'tomato',
    name: 'Tomato Late Blight',
    scientificName: 'Phytophthora infestans',
    severity: 'Severe',
    confidence: 96.8,
    description: 'A devastating water mold pathogen spreading rapidly in cool, wet conditions, producing water-soaked dark gray spots with white downy mold underneath.',
    symptoms: [
      'Irregular water-soaked dark gray to purplish-black lesions',
      'White downy fungal growth under wet leaf surfaces',
      'Rapid stem wilting and leaf collapse within 3-5 days',
      'Foul odor in heavily infected field patches'
    ],
    immediateAction: [
      'Remove and destroy entire heavily infected plants immediately (do not compost)',
      'Stop overhead watering; switch to drip irrigation',
      'Apply protective copper fungicide to surrounding healthy plants'
    ],
    prevention: [
      'Use certified pathogen-free seeds and transplants',
      'Destroy volunteer tomato and potato plants nearby',
      'Ensure maximum solar exposure and field drainage'
    ],
    biologicalControl: [
      'Pseudomonas fluorescens leaf sprays (20g/L)',
      'Garlic extract sprays for localized protective coating'
    ],
    chemicalControl: [
      'Metalaxyl + Mancozeb @ 2g/L water',
      'Cymoxanil + Mancozeb systemically applied'
    ],
    researchPaperReference: '2025 IEEE Access Tomato Disease Benchmark Dataset #TB-2025-09'
  },

  'tomato-healthy': {
    id: 'tomato-healthy',
    cropId: 'tomato',
    name: 'Healthy Tomato Leaf',
    scientificName: 'Solanum lycopersicum (Vigorous)',
    severity: 'Healthy',
    confidence: 98.5,
    description: 'No pathogenic lesions, chlorosis, or necrotic spots detected. The leaf exhibits vibrant green color and uniform cellular integrity.',
    symptoms: [
      'Uniform deep green leaf blade coloration',
      'Smooth blade margins without yellow halos or spots',
      'Turgid stem structure and intact leaf cuticle'
    ],
    immediateAction: [
      'Maintain standard irrigation and organic fertilization schedule',
      'Inspect crop leaves weekly for early insect or fungal activity'
    ],
    prevention: [
      'Continue regular soil enrichment with balanced compost (N-P-K 10-10-10)',
      'Ensure consistent morning watering at the root base'
    ],
    biologicalControl: [
      'Routine prophylactic neem oil foliar spray (monthly)'
    ],
    researchPaperReference: '2025 IEEE Access Baseline Control Group #HC-001'
  },

  'potato-early-blight': {
    id: 'potato-early-blight',
    cropId: 'potato',
    name: 'Potato Early Blight',
    scientificName: 'Alternaria solani',
    severity: 'Moderate',
    confidence: 92.4,
    description: 'Fungal brown spots with concentric ring patterns on older foliage, reducing tuber yield if left unmanaged.',
    symptoms: [
      'Dark brown angular spots bounded by leaf veins',
      'Yellow chlorotic leaf tissue around brown lesions',
      'Brittle leaves curling upwards and dropping'
    ],
    immediateAction: [
      'Strip infected lower leaves and discard away from fields',
      'Maintain moderate soil moisture without leaf wetting'
    ],
    prevention: [
      'Plant certified disease-resistant seed potatoes',
      'Ensure adequate nitrogen and potassium fertility to avoid stress'
    ],
    biologicalControl: [
      'Trichoderma harzianum soil amendment and foliage spray'
    ],
    chemicalControl: [
      'Chlorothalonil 75% WP @ 2g/L water'
    ]
  },

  'potato-healthy': {
    id: 'potato-healthy',
    cropId: 'potato',
    name: 'Healthy Potato Foliage',
    scientificName: 'Solanum tuberosum (Healthy)',
    severity: 'Healthy',
    confidence: 97.9,
    description: 'Vigorous potato foliage with no signs of fungal or bacterial lesions.',
    symptoms: ['Clean foliage', 'Robust leaf density', 'No brown spots'],
    immediateAction: ['Maintain regular weeding and hilling practices.'],
    prevention: ['Keep fields clean of nightshade weeds.'],
    researchPaperReference: '2025 IEEE Access Benchmark #PH-002'
  },

  'maize-common-rust': {
    id: 'maize-common-rust',
    cropId: 'maize',
    name: 'Maize Common Rust',
    scientificName: 'Puccinia sorghi',
    severity: 'Moderate',
    confidence: 91.5,
    description: 'Small reddish-brown powdery pustules on both upper and lower leaf surfaces.',
    symptoms: [
      'Oval to elongated cinnamon-brown pustules',
      'Powdery rusty dust (spores) rubbing off on fingers',
      'Yellowing of heavily pustuled leaf tips'
    ],
    immediateAction: [
      'Apply bio-fungicide at first sign of pustule formation',
      'Avoid high nitrogen fertilizer application during humid weather'
    ],
    prevention: [
      'Plant resistant corn hybrids with high rust tolerance',
      'Plant early in the season to avoid peak spore rust migration'
    ],
    biologicalControl: [
      'Bacillus subtilis foliar application'
    ],
    chemicalControl: [
      'Propiconazole 25% EC @ 1ml/L water'
    ]
  },

  'maize-healthy': {
    id: 'maize-healthy',
    cropId: 'maize',
    name: 'Healthy Maize Leaf',
    scientificName: 'Zea mays (Healthy)',
    severity: 'Healthy',
    confidence: 99.1,
    description: 'Clean green leaf blade without rust pustules or blight streaks.',
    symptoms: ['Smooth green leaf veins', 'No reddish pustules', 'Healthy canopy'],
    immediateAction: ['Continue recommended weed control and irrigation.'],
    prevention: ['Ensure adequate plant density.']
  },

  'rice-leaf-blast': {
    id: 'rice-leaf-blast',
    cropId: 'rice',
    name: 'Rice Leaf Blast',
    scientificName: 'Magnaporthe oryzae',
    severity: 'Severe',
    confidence: 95.0,
    description: 'Spindle-shaped lesions with grayish-white centers and reddish-brown borders on rice leaves.',
    symptoms: [
      'Diamond or spindle-shaped leaf spots',
      'Grayish-white center with brown margin',
      'Lesions merging together to burn entire leaves'
    ],
    immediateAction: [
      'Drain standing water from paddy field for 3-4 days to reduce moisture',
      'Refrain from top-dressing nitrogenous fertilizers'
    ],
    prevention: [
      'Treat seeds with Carbendazim before sowing',
      'Maintain optimum water management'
    ],
    biologicalControl: [
      'Pseudomonas fluorescens (10g/kg seed treatment)'
    ],
    chemicalControl: [
      'Tricyclazole 75% WP @ 0.6g/L water'
    ]
  },

  'rice-healthy': {
    id: 'rice-healthy',
    cropId: 'rice',
    name: 'Healthy Rice Leaf',
    scientificName: 'Oryza sativa (Healthy)',
    severity: 'Healthy',
    confidence: 98.2,
    description: 'Vigorous paddy foliage free of spindle lesions.',
    symptoms: ['Intact green leaf blades', 'No blast spots'],
    immediateAction: ['Maintain water depth at 2-5 cm.'],
    prevention: ['Balanced N-P-K fertilizer regime.']
  },

  'banana-black-sigatoka': {
    id: 'banana-black-sigatoka',
    cropId: 'banana',
    name: 'Banana Black Sigatoka',
    scientificName: 'Pseudocercospora fijiensis',
    severity: 'Severe',
    confidence: 93.6,
    description: 'Dark reddish-brown to black streaks parallel to leaf veins, causing premature leaf death.',
    symptoms: [
      'Reddish-brown narrow streaks on lower leaf surface',
      'Streaks enlarging into dark brown water-soaked spots',
      'Center of spots dry out to light gray with dark borders'
    ],
    immediateAction: [
      'De-leaf severely infected leaves and bury or burn them outside plantation',
      'Improve drainage to reduce humidity'
    ],
    prevention: [
      'Maintain wide plant spacing (3m x 2m)',
      'Prune suckers to ensure adequate sunlight penetration'
    ],
    biologicalControl: [
      'Bacillus amyloliquefaciens sprays'
    ],
    chemicalControl: [
      'Mancozeb 75% WP @ 2.5g/L mixed with mineral oil'
    ]
  },

  'chilli-leaf-curl': {
    id: 'chilli-leaf-curl',
    cropId: 'chilli',
    name: 'Chilli Leaf Curl Virus',
    scientificName: 'Chilli leaf curl virus (ChiLCV)',
    severity: 'Severe',
    confidence: 92.8,
    description: 'Viral disease transmitted by whiteflies causing curling of leaves upwards, puckering, and stunted plant growth.',
    symptoms: [
      'Upward curling and cupping of leaf margins',
      'Thickened leaf veins and stunted internodes',
      'Shedding of flowers and small distorted fruits'
    ],
    immediateAction: [
      'Uproot and destroy heavily stunted viral-infected plants',
      'Install yellow sticky traps (15-20 per acre) to catch whiteflies'
    ],
    prevention: [
      'Cover nursery beds with 40-mesh insect-proof netting',
      'Refrain from planting near old infested solanaceous crops'
    ],
    biologicalControl: [
      'Spray Verticillium lecanii or Neem oil (10,000 ppm) @ 3ml/L water against whitefly vectors'
    ],
    chemicalControl: [
      'Imidacloprid 17.8% SL @ 0.3ml/L water to manage vector whiteflies'
    ]
  }
};

export const getDiseaseById = (diseaseId: string): DiseaseInfo => {
  return DISEASES_DATABASE[diseaseId] || DISEASES_DATABASE['tomato-early-blight'];
};

export const getDefaultDiseaseForCrop = (cropId: CropId): DiseaseInfo => {
  switch (cropId) {
    case 'tomato':
      return DISEASES_DATABASE['tomato-early-blight'];
    case 'potato':
      return DISEASES_DATABASE['potato-early-blight'];
    case 'maize':
      return DISEASES_DATABASE['maize-common-rust'];
    case 'rice':
      return DISEASES_DATABASE['rice-leaf-blast'];
    case 'banana':
      return DISEASES_DATABASE['banana-black-sigatoka'];
    case 'chilli':
      return DISEASES_DATABASE['chilli-leaf-curl'];
    default:
      return DISEASES_DATABASE['tomato-early-blight'];
  }
};
