import type { DiseaseKnowledge, CropId } from '../models/types';

export const DISEASES_KNOWLEDGE_BASE: Record<string, DiseaseKnowledge> = {
  'tomato-bacterial-spot': {
    id: 'tomato-bacterial-spot',
    cropId: 'tomato',
    name: 'Tomato Bacterial Spot',
    scientificName: 'Xanthomonas perforans',
    description: 'A bacterial infection affecting foliage, stems, and fruit under warm, wet weather conditions.',
    commonSymptoms: [
      'Small (1–3 mm) dark, water-soaked spots on leaf blades',
      'Lesions turning dark brown to black with faint yellow chlorotic halos',
      'Premature defoliation in severe, unmanaged field conditions'
    ],
    generalManagement: [
      'Remove and safely destroy heavily infected crop debris',
      'Apply protective copper-based bactericides early in the cropping season',
      'Avoid working in wet fields or using overhead sprinkler irrigation'
    ],
    preventativeMeasures: [
      'Use certified pathogen-free seeds and transplants',
      'Practice 2 to 3 year crop rotation with non-solanaceous crops'
    ]
  },

  'tomato-early-blight': {
    id: 'tomato-early-blight',
    cropId: 'tomato',
    name: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    description: 'A common fungal pathogen characterized by concentric target-pattern spots on older foliage.',
    commonSymptoms: [
      'Concentric dark brown leaf spots with distinct target-like ring patterns',
      'Symptoms appearing first on lower, older leaves near soil level',
      'Chlorotic yellowing around leaf lesions leading to leaf drop'
    ],
    generalManagement: [
      'Prune and discard infected lower foliage to reduce spore load',
      'Apply organic or copper-based protective fungicides at first sign of spots',
      'Maintain wide plant spacing (60 cm) to promote air circulation'
    ],
    preventativeMeasures: [
      'Mulch soil with straw or plastic to prevent soil splash onto leaves',
      'Rotate crops with non-solanaceous families'
    ]
  },

  'tomato-late-blight': {
    id: 'tomato-late-blight',
    cropId: 'tomato',
    name: 'Tomato Late Blight',
    scientificName: 'Phytophthora infestans',
    description: 'A destructive oomycete pathogen capable of spreading rapidly during cool, humid, wet weather.',
    commonSymptoms: [
      'Irregular water-soaked dark gray to purplish-black necrotic lesions',
      'White downy fungal growth visible on undersides of foliage during wet conditions',
      'Rapid leaf collapse and stem wilting under high moisture'
    ],
    generalManagement: [
      'Uproot and destroy heavily infected plants immediately away from fields',
      'Switch from overhead sprinkler to base drip irrigation',
      'Apply systemic or protective copper fungicides immediately to surrounding plants'
    ],
    preventativeMeasures: [
      'Plant certified disease-resistant varieties',
      'Ensure good soil drainage and solar canopy exposure'
    ]
  },

  'tomato-leaf-mold': {
    id: 'tomato-leaf-mold',
    cropId: 'tomato',
    name: 'Tomato Leaf Mold',
    scientificName: 'Passalora fulva',
    description: 'A fungal disease thriving in high relative humidity environments, particularly in greenhouses.',
    commonSymptoms: [
      'Pale green to pale yellow chlorotic spots on upper leaf surfaces',
      'Olive-green to dark velvety downy mold underneath affected leaves',
      'Withering and premature dropping of infected foliage'
    ],
    generalManagement: [
      'Increase greenhouse or field ventilation to keep relative humidity below 85%',
      'Prune dense canopy leaves to enhance light and internal airflow'
    ],
    preventativeMeasures: [
      'Use resistant tomato cultivars (e.g. Fulvia-resistant lines)',
      'Avoid late evening irrigation'
    ]
  },

  'tomato-septoria-leaf-spot': {
    id: 'tomato-septoria-leaf-spot',
    cropId: 'tomato',
    name: 'Tomato Septoria Leaf Spot',
    scientificName: 'Septoria lycopersici',
    description: 'A fungal leaf disease causing small, circular spots with dark margins and light gray centers.',
    commonSymptoms: [
      'Small circular leaf spots (1.5–3 mm) with tan centers and dark borders',
      'Tiny black specks (pycnidia) visible inside the center of mature spots',
      'Progressive defoliation moving from lower leaves upwards'
    ],
    generalManagement: [
      'Strip affected lower leaves early in infection cycle',
      'Apply protective Mancozeb or copper hydroxide foliar sprays'
    ],
    preventativeMeasures: [
      'Practice 3-year crop rotation',
      'Keep field area clear of nightshade weeds'
    ]
  },

  'tomato-spider-mites': {
    id: 'tomato-spider-mites',
    cropId: 'tomato',
    name: 'Two-Spotted Spider Mite Damage',
    scientificName: 'Tetranychus urticae',
    description: 'Microscopic arachnid pests feeding on plant sap on the undersides of leaves.',
    commonSymptoms: [
      'Fine white to yellow stippling or speckling on upper leaf surfaces',
      'Fine silky webbing visible on undersides of leaves and leaf axils',
      'Foliage turning bronzed, dry, and brittle under heavy feeding'
    ],
    generalManagement: [
      'Spray leaf undersides with strong water streams to dislodge webbing',
      'Apply insecticidal soap or 1% Neem oil foliar spray'
    ],
    preventativeMeasures: [
      'Maintain adequate moisture; avoid dry, dusty field conditions',
      'Release predatory mites (Phytoseiulus persimilis)'
    ]
  },

  'tomato-target-spot': {
    id: 'tomato-target-spot',
    cropId: 'tomato',
    name: 'Tomato Target Spot',
    scientificName: 'Corynespora cassiicola',
    description: 'A fungal pathogen causing brown leaf spots with subtle concentric rings under warm, humid conditions.',
    commonSymptoms: [
      'Pinpoint brown spots expanding into circular target-patterned lesions',
      'Yellow chlorotic halos surrounding necrotic spots',
      'Premature blighting of foliage in dense plant canopies'
    ],
    generalManagement: [
      'Prune lower dense foliage to lower canopy humidity',
      'Apply Azoxystrobin or Chlorothalonil protective spray'
    ],
    preventativeMeasures: [
      'Clean crop residues post-harvest',
      'Rotate with non-host crop families'
    ]
  },

  'tomato-yellow-leaf-curl-virus': {
    id: 'tomato-yellow-leaf-curl-virus',
    cropId: 'tomato',
    name: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    scientificName: 'Begomovirus (TYLCV)',
    description: 'A viral disease transmitted by silverleaf whiteflies (Bemisia tabaci).',
    commonSymptoms: [
      'Upward curling and cupping of leaf margins with prominent yellowing',
      'Marked reduction in leaf blade size and leaf puckering',
      'Stunted overall plant growth and blossom drop'
    ],
    generalManagement: [
      'Promptly uproot and destroy viral-infected plants',
      'Deploy yellow sticky traps to monitor whitefly vector populations'
    ],
    preventativeMeasures: [
      'Plant TYLCV-resistant hybrid varieties',
      'Use 50-mesh insect-proof netting over nursery beds'
    ]
  },

  'tomato-mosaic-virus': {
    id: 'tomato-mosaic-virus',
    cropId: 'tomato',
    name: 'Tomato Mosaic Virus (ToMV)',
    scientificName: 'Tobamovirus (ToMV)',
    description: 'A mechanically transmitted virus causing mosaic discoloration and foliage distortion.',
    commonSymptoms: [
      'Alternating light green and dark green mosaic patches on leaves',
      'Distorted, narrow, stringy or "shoestring" leaf growth',
      'Internal fruit browning and general plant stunting'
    ],
    generalManagement: [
      'Rogue out and destroy symptomatic viral plants',
      'Wash hands thoroughly with soap before handling healthy foliage'
    ],
    preventativeMeasures: [
      'Use certified virus-free seeds',
      'Avoid tobacco product use near crop plants'
    ]
  },

  'tomato-healthy': {
    id: 'tomato-healthy',
    cropId: 'tomato',
    name: 'Healthy Tomato Leaf',
    scientificName: 'Solanum lycopersicum',
    description: 'No pathogenic lesions, chlorosis, or necrotic spots detected.',
    commonSymptoms: [
      'Uniform deep green leaf blade coloration',
      'Smooth blade margins without chlorotic halos or spots',
      'Turgid stem structure and intact leaf cuticle'
    ],
    generalManagement: [
      'Maintain regular irrigation and balanced organic fertilization',
      'Inspect crop leaves weekly for early pest or fungal activity'
    ],
    preventativeMeasures: [
      'Continue regular soil compost enrichment',
      'Ensure consistent morning root watering'
    ]
  }
};

export const getDiseaseKnowledgeById = (id: string): DiseaseKnowledge => {
  return DISEASES_KNOWLEDGE_BASE[id] || DISEASES_KNOWLEDGE_BASE['tomato-early-blight'];
};

export const getDefaultDiseaseKnowledgeForCrop = (_cropId: CropId): DiseaseKnowledge => {
  return DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
};
