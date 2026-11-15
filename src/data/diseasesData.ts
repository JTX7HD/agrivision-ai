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
  },

  // -------------------------------------------------------------
  // POTATO (Solanum tuberosum) - Intended Additional Crop 1
  // -------------------------------------------------------------
  'potato-early-blight': {
    id: 'potato-early-blight',
    cropId: 'potato',
    name: 'Potato Early Blight',
    scientificName: 'Alternaria solani',
    description: 'Fungal leaf pathogen causing dark brown lesions with concentric target rings on potato foliage.',
    commonSymptoms: [
      'Circular to angular dark brown necrotic lesions on foliage',
      'Concentric target-like rings visible within mature lesions',
      'Chlorotic yellowing around spots leading to premature leaf drop'
    ],
    generalManagement: [
      'Remove and destroy infected haulms to prevent tuber infection',
      'Apply protective copper or chlorothalonil fungicides early in development',
      'Avoid overhead irrigation to minimize leaf wetness duration'
    ],
    preventativeMeasures: [
      'Plant certified disease-free seed tubers',
      'Practice 3-year crop rotation with non-solanaceous crops'
    ]
  },

  'potato-late-blight': {
    id: 'potato-late-blight',
    cropId: 'potato',
    name: 'Potato Late Blight',
    scientificName: 'Phytophthora infestans',
    description: 'Highly destructive oomycete disease capable of rapid defoliation under cool, humid weather.',
    commonSymptoms: [
      'Water-soaked dark lesions spreading rapidly across leaves',
      'White downy fungal-like growth on leaf undersides during moist mornings',
      'Rapid rotting of stems and browning of canopy'
    ],
    generalManagement: [
      'Apply preventive systemic fungicides (e.g. cymoxanil or dimethomorph)',
      'Destroy volunteer potato plants and cull piles',
      'Ensure hill soil coverage to protect developing tubers from spores'
    ],
    preventativeMeasures: [
      'Plant late blight-resistant potato cultivars',
      'Ensure wide row spacing to facilitate air circulation'
    ]
  },

  'potato-healthy': {
    id: 'potato-healthy',
    cropId: 'potato',
    name: 'Healthy Potato Foliage',
    scientificName: 'Solanum tuberosum',
    description: 'Healthy compound potato foliage with no lesions, blight spots, or chlorosis.',
    commonSymptoms: [
      'Vibrant green pinnate leaf blades with uniform texture',
      'Clean margins free of necrosis or fungal sporulation',
      'Erect, robust stem habit'
    ],
    generalManagement: [
      'Maintain balanced nitrogen-potassium soil fertility',
      'Ensure regular hill weeding and drip irrigation'
    ],
    preventativeMeasures: [
      'Monitor weekly for potato beetle or early blight spots',
      'Avoid water stress during tuber initiation'
    ]
  },

  // -------------------------------------------------------------
  // PEPPER / CHILLI (Capsicum annuum) - Intended Additional Crop 2
  // -------------------------------------------------------------
  'pepper-bacterial-spot': {
    id: 'pepper-bacterial-spot',
    cropId: 'chilli',
    name: 'Pepper Bacterial Spot',
    scientificName: 'Xanthomonas campestris pv. vesicatoria',
    description: 'Bacterial pathogen causing small, irregular dark spots on leaves, stems, and bell/chilli peppers.',
    commonSymptoms: [
      'Small, circular or irregular water-soaked spots on foliage',
      'Lesions turning dark brown to black with slightly raised centers',
      'Extensive yellowing and defoliation under warm, wet conditions'
    ],
    generalManagement: [
      'Apply protective copper bactericide sprays mixed with mancozeb',
      'Avoid working among wet plants to prevent mechanical bacterial transmission',
      'Remove and destroy infected plant residues post-harvest'
    ],
    preventativeMeasures: [
      'Use certified pathogen-free pepper seeds and transplants',
      'Rotate fields away from solanaceous crops for at least 2 seasons'
    ]
  },

  'pepper-healthy': {
    id: 'pepper-healthy',
    cropId: 'chilli',
    name: 'Healthy Pepper Leaf',
    scientificName: 'Capsicum annuum',
    description: 'Healthy, intact pepper/chilli foliage showing normal green coloration and leaf turgor.',
    commonSymptoms: [
      'Glossy, deep green entire leaf blades with smooth margins',
      'No water-soaked spots, stippling, or chlorotic halos',
      'Normal branching and flower bud formation'
    ],
    generalManagement: [
      'Ensure well-drained soil and consistent soil moisture',
      'Apply organic mulch to maintain root zone temperature'
    ],
    preventativeMeasures: [
      'Inspect for aphids and thrips weekly',
      'Maintain balanced calcium levels to prevent blossom-end rot'
    ]
  },

  // -------------------------------------------------------------
  // CHILLI (Capsicum annuum) - KrishokTech 8-Class Production Pathology
  // -------------------------------------------------------------
  'chilli-bacterial-spot': {
    id: 'chilli-bacterial-spot',
    cropId: 'chilli',
    name: 'Chilli Bacterial Spot',
    scientificName: 'Xanthomonas campestris pv. vesicatoria',
    description: 'Bacterial pathogen causing small, water-soaked necrotic lesions on chilli foliage and fruit.',
    commonSymptoms: [
      'Small water-soaked leaf spots turning dark brown or black with chlorotic halos',
      'Lesions coalesce leading to extensive leaf yellowing and premature defoliation',
      'Sunken scabby spots on green and ripe chilli pods'
    ],
    generalManagement: [
      'Apply copper oxychloride (2 g/L) or copper hydroxide protective bactericides',
      'Avoid handling wet plants or using overhead sprinkler irrigation',
      'Safely remove and bury severely infected crop residue'
    ],
    preventativeMeasures: [
      'Use certified disease-free hot water-treated seeds (50°C for 25 min)',
      'Practice 2 to 3 year crop rotation away from solanaceous plants'
    ]
  },

  'chilli-cercospora-leaf-spot': {
    id: 'chilli-cercospora-leaf-spot',
    cropId: 'chilli',
    name: 'Chilli Cercospora Leaf Spot (Frog-Eye Spot)',
    scientificName: 'Cercospora capsici',
    description: 'Fungal pathogen causing circular lesions with distinctive light gray centers and dark reddish-brown borders.',
    commonSymptoms: [
      'Circular leaf lesions with distinctive ash-gray or white centers (frog-eye appearance)',
      'Dark reddish-brown prominent margins surrounding spots',
      'Extensive leaf chlorosis and leaf drop under warm, humid conditions'
    ],
    generalManagement: [
      'Apply carbendazim (1 g/L) or difenoconazole (0.5 mL/L) at 10-12 day intervals',
      'Collect and safely burn fallen infected foliage to reduce inoculum',
      'Ensure good canopy airflow through proper plant spacing'
    ],
    preventativeMeasures: [
      'Treat seeds prior to sowing with trichoderma or thiram',
      'Avoid planting in low-lying, poorly drained fields'
    ]
  },

  'chilli-leaf-curl-virus': {
    id: 'chilli-leaf-curl-virus',
    cropId: 'chilli',
    name: 'Chilli Leaf Curl Virus (ChiLCV)',
    scientificName: 'Chilli leaf curl virus (Begomovirus / Geminiviridae)',
    description: 'Devastating viral complex transmitted by whiteflies causing severe foliar curling, dwarfing, and yield loss.',
    commonSymptoms: [
      'Severe upward and downward curling and puckering of leaves',
      'Leaf thickening, vein swelling, and reduction in leaf size',
      'Extreme plant stunting with bushy, bunched habit and flower drop'
    ],
    generalManagement: [
      'Deploy yellow sticky traps (15-20 per acre) to monitor and suppress whitefly vectors',
      'Apply systemic insecticides such as imidacloprid (0.5 mL/L) or acetamiprid for vector suppression',
      'Rogue out and destroy infected viral reservoir plants immediately'
    ],
    preventativeMeasures: [
      'Install 40-mesh insect-proof netting over seedling nursery beds',
      'Use barrier crops like maize, sorghum, or pearl millet around chilli borders'
    ]
  },

  'chilli-healthy': {
    id: 'chilli-healthy',
    cropId: 'chilli',
    name: 'Healthy Chilli Foliage',
    scientificName: 'Capsicum annuum',
    description: 'Healthy, vigorous chilli foliage showing uniform green pigmentation, smooth leaf margins, and robust turgor.',
    commonSymptoms: [
      'Smooth, deep green leaves without curling, lesions, or mosaic patterns',
      'Clean leaf undersides free of pests or fungal sporulation',
      'Normal internodal elongation with prolific flowering and fruit setting'
    ],
    generalManagement: [
      'Maintain balanced NPK fertigation with regular micro-irrigation',
      'Ensure consistent soil moisture without waterlogging root zones'
    ],
    preventativeMeasures: [
      'Routine weekly scouting for sap-sucking pests (whiteflies, thrips, mites)',
      'Maintain clean field borders free of solanaceous weeds'
    ]
  },

  'chilli-nutrient-deficiency': {
    id: 'chilli-nutrient-deficiency',
    cropId: 'chilli',
    name: 'Chilli Nutrient Deficiency',
    scientificName: 'Physiological chlorosis (N / P / K / Fe / Mg)',
    description: 'Physiological disorder caused by insufficient or imbalanced essential macro- or micronutrients in the soil.',
    commonSymptoms: [
      'Interveinal chlorosis and generalized yellowing of older leaves (Nitrogen)',
      'Marginal scorching and curling of leaf tips (Potassium)',
      'Purpling of leaf undersides and veins (Phosphorus)'
    ],
    generalManagement: [
      'Conduct soil and foliar tissue testing to identify exact element deficiency',
      'Apply foliar spray of balanced micronutrient mixture (chelated Fe, Zn, Boron, Mg)',
      'Side-dress with well-rotted compost and balanced water-soluble NPK fertilizers'
    ],
    preventativeMeasures: [
      'Adjust soil pH to optimal 6.0–6.8 range for nutrient availability',
      'Incorporate well-decomposed organic manure before transplanting'
    ]
  },

  'chilli-others': {
    id: 'chilli-others',
    cropId: 'chilli',
    name: 'Other / Unidentified Leaf Condition',
    scientificName: 'Non-pathological / Out-of-distribution',
    description: 'Image does not match known chilli leaf pathology classes or contains foreign, unidentifiable plant matter.',
    commonSymptoms: [
      'Atypical symptomology not matching standard chilli fungal, bacterial, or viral patterns',
      'Extreme background clutter or non-chilli plant foliage in camera view',
      'Blurred or off-center photo capture'
    ],
    generalManagement: [
      'Take a clear, well-focused close-up photo of an individual infected chilli leaf in bright daylight',
      'Inspect both upper and lower leaf surfaces for signs of insect pests',
      'Consult local agricultural extension officer (KVK) or call Kisan Helpline (1800-180-1551 / 16123)'
    ],
    preventativeMeasures: [
      'Scout crop systematically across field diagonals weekly',
      'Document symptom progression across multiple plants'
    ]
  },

  'chilli-powdery-mildew': {
    id: 'chilli-powdery-mildew',
    cropId: 'chilli',
    name: 'Chilli Powdery Mildew',
    scientificName: 'Leveillula taurica',
    description: 'Obligate fungal pathogen flourishing under warm, dry days and humid nights, causing white patches on leaf undersides.',
    commonSymptoms: [
      'White powdery fungal patches on the undersides of leaves',
      'Corresponding pale yellow or chlorotic blotches on upper leaf surfaces',
      'Curling of leaf margins and premature shedding of older leaves'
    ],
    generalManagement: [
      'Apply wettable sulfur (2 g/L) or hexaconazole / myclobutanil at earliest symptom onset',
      'Ensure adequate plant spacing to facilitate air circulation throughout the crop canopy',
      'Avoid excessive nitrogen fertilization which produces overly succulent foliage'
    ],
    preventativeMeasures: [
      'Cultivate partially resistant chilli varieties in high-risk zones',
      'Collect and safely compost or destroy fallen defoliated leaves'
    ]
  },

  'chilli-white-spot': {
    id: 'chilli-white-spot',
    cropId: 'chilli',
    name: 'Chilli Anthracnose / White Spot (Dieback)',
    scientificName: 'Colletotrichum capsici',
    description: 'Severe fungal disease causing sunken circular fruit rot lesions, tip dieback, and circular bleached foliar spots.',
    commonSymptoms: [
      'Small circular white or pale gray bleached spots with dark margins on foliage',
      'Sunken circular necrotic lesions on ripening and ripe chilli pods with concentric rings of acervuli',
      'Dieback of twigs from branch tips downward'
    ],
    generalManagement: [
      'Spray propiconazole (0.5 mL/L), azoxystrobin (1 mL/L), or copper oxychloride (2.5 g/L)',
      'Remove and destroy infected fruits and twigs to prevent spore dissemination',
      'Harvest ripe chilli pods promptly to minimize field exposure'
    ],
    preventativeMeasures: [
      'Treat seed with carbendazim or thiram (2 g/kg seed) before sowing',
      'Avoid overhead sprinkler irrigation during flowering and fruit ripening'
    ]
  },

  // -------------------------------------------------------------
  // MAIZE (Zea mays)
  // -------------------------------------------------------------
  'maize-common-rust': {
    id: 'maize-common-rust',
    cropId: 'maize',
    name: 'Maize Common Rust',
    scientificName: 'Puccinia sorghi',
    description: 'Fungal leaf rust disease characterized by reddish-brown pustules on both leaf surfaces.',
    commonSymptoms: [
      'Golden to cinnamon-brown powdery pustules on upper and lower leaf blades',
      'Pustules erupting through the epidermis releasing powdery spores',
      'Severe chlorosis and leaf death in susceptible maize lines'
    ],
    generalManagement: [
      'Apply foliar strobilurin or triazole fungicides if pustules appear pre-tassel',
      'Ensure balanced soil nutrition to support natural plant defense'
    ],
    preventativeMeasures: [
      'Plant rust-resistant corn hybrids',
      'Plant early in the season to avoid peak summer spore dispersal'
    ]
  },

  'maize-northern-blight': {
    id: 'maize-northern-blight',
    cropId: 'maize',
    name: 'Northern Corn Leaf Blight',
    scientificName: 'Exserohilum turcicum',
    description: 'Fungal pathogen causing long, elliptical, grayish-green or tan lesions on corn foliage.',
    commonSymptoms: [
      'Cigar-shaped elliptical lesions (2.5 to 15 cm long) on foliage',
      'Lesions turning grayish-tan with dark fungal sporulation in humid air',
      'Extensive blighting of entire leaves during grain fill'
    ],
    generalManagement: [
      'Apply protective fungicides if disease appears prior to silk emergence',
      'Plow down infected residue to accelerate decomposition'
    ],
    preventativeMeasures: [
      'Rotate crops with soybean or small grains',
      'Select resistant corn hybrids with Ht-gene resistance'
    ]
  },

  'maize-gray-leaf-spot': {
    id: 'maize-gray-leaf-spot',
    cropId: 'maize',
    name: 'Maize Gray Leaf Spot',
    scientificName: 'Cercospora zeae-maydis',
    description: 'Fungal pathogen causing distinct rectangular lesions bounded by leaf veins.',
    commonSymptoms: [
      'Narrow rectangular tan to gray spots strictly bounded by parallel leaf veins',
      'Lesions expanding and coalescing into broad areas of necrotic tissue',
      'Premature canopy senescence leading to reduced grain yield'
    ],
    generalManagement: [
      'Foliar fungicide application at VT-R1 growth stages if threshold exceeded',
      'Improve field drainage to reduce canopy humidity'
    ],
    preventativeMeasures: [
      'Practice 2-year crop rotation out of maize',
      'Plant certified hybrids with partial resistance to Cercospora'
    ]
  },

  'maize-healthy': {
    id: 'maize-healthy',
    cropId: 'maize',
    name: 'Healthy Maize Foliage',
    scientificName: 'Zea mays',
    description: 'Healthy linear maize leaf blade with prominent midrib and clear green pigmentation.',
    commonSymptoms: [
      'Uniform dark green coloration across the parallel-veined leaf blade',
      'Clear midrib with no pustules, stripes, or necrotic lesions',
      'Erect leaf architecture capturing maximum sunlight'
    ],
    generalManagement: [
      'Maintain adequate side-dressed nitrogen and potassium',
      'Provide regular irrigation during critical pollination window'
    ],
    preventativeMeasures: [
      'Scout regularly for fall armyworm and rust symptoms',
      'Ensure optimum plant population density'
    ]
  }
};

export const getDiseaseKnowledgeById = (id: string): DiseaseKnowledge => {
  return DISEASES_KNOWLEDGE_BASE[id] || DISEASES_KNOWLEDGE_BASE['tomato-early-blight'];
};

export const getDefaultDiseaseKnowledgeForCrop = (cropId: CropId): DiseaseKnowledge => {
  switch (cropId) {
    case 'potato':
      return DISEASES_KNOWLEDGE_BASE['potato-healthy'] || DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
    case 'chilli':
      return DISEASES_KNOWLEDGE_BASE['chilli-healthy'] || DISEASES_KNOWLEDGE_BASE['pepper-healthy'] || DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
    case 'maize':
      return DISEASES_KNOWLEDGE_BASE['maize-healthy'] || DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
    case 'tomato':
    default:
      return DISEASES_KNOWLEDGE_BASE['tomato-healthy'];
  }
};
