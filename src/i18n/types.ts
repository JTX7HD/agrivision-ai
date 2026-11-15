export type Locale =
  | 'en'
  | 'as'
  | 'bn'
  | 'brx'
  | 'doi'
  | 'gu'
  | 'hi'
  | 'kn'
  | 'ks'
  | 'kok'
  | 'mai'
  | 'ml'
  | 'mni'
  | 'mr'
  | 'ne'
  | 'or'
  | 'pa'
  | 'sa'
  | 'sat'
  | 'sd'
  | 'ta'
  | 'te'
  | 'ur';

export interface LanguageMeta {
  code: Locale;
  name: string;
  nativeName: string;
  script: string;
  dir: 'ltr' | 'rtl';
  isOfficialScheduled: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', dir: 'ltr', isOfficialScheduled: false },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Eastern Nagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', dir: 'ltr', isOfficialScheduled: true },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', dir: 'ltr', isOfficialScheduled: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', dir: 'ltr', isOfficialScheduled: true },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', script: 'Perso-Arabic', dir: 'rtl', isOfficialScheduled: true },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', dir: 'ltr', isOfficialScheduled: true },
  { code: 'mni', name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', script: 'Meetei Mayek', dir: 'ltr', isOfficialScheduled: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', dir: 'ltr', isOfficialScheduled: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', dir: 'ltr', isOfficialScheduled: true },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari', dir: 'ltr', isOfficialScheduled: true },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki', dir: 'ltr', isOfficialScheduled: true },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', script: 'Arabic-Sindhi', dir: 'rtl', isOfficialScheduled: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', dir: 'ltr', isOfficialScheduled: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', dir: 'ltr', isOfficialScheduled: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Perso-Arabic', dir: 'rtl', isOfficialScheduled: true }
];

export interface TranslationDictionary {
  nav: {
    home: string;
    dashboard: string;
    scan: string;
    history: string;
    about: string;
    language: string;
  };
  crops: {
    tomato: string;
    tomatoDesc: string;
    potato: string;
    potatoDesc: string;
    maize: string;
    maizeDesc: string;
    rice: string;
    riceDesc: string;
    banana: string;
    bananaDesc: string;
    chilli: string;
    chilliDesc: string;
    selectCrop: string;
    selected: string;
  };
  scan: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    noPhoto: string;
    photoAdvice: string;
    openCamera: string;
    uploadPhoto: string;
    orSelectDemo: string;
    checkLeafBtn: string;
    retake: string;
    selectAnother: string;
    dropNotice: string;
    invalidFormat: string;
    fileTooLarge: string;
  };
  pipeline: {
    evaluating: string;
    runningStages: string;
    stage1Name: string;
    stage1Desc: string;
    stage2Name: string;
    stage2Desc: string;
    stage3Name: string;
    stage3Desc: string;
    stage4Name: string;
    stage4Desc: string;
    stage5Name: string;
    stage5Desc: string;
    qualityPassed: string;
    qualityFailed: string;
    leafDetected: string;
    noLeafFound: string;
    segmentationDone: string;
    classificationDone: string;
    explainabilityDone: string;
  };
  results: {
    imageAnalyzed: string;
    yoloConfidence: string;
    diseaseClassification: string;
    uncertainCondition: string;
    topConfidence: string;
    margin: string;
    confidenceLevel: string;
    highConfidence: string;
    moderateConfidence: string;
    lowConfidence: string;
    aboutDisease: string;
    commonSymptoms: string;
    management: string;
    aiDisclaimer: string;
    analyzeAnother: string;
    exportDataset: string;
    goToDashboard: string;
    correctLabel: string;
    testingNotice: string;
    groundTruthCorrected: string;
    topProbabilities: string;
    runnerUp: string;
  };
  uncertainty: {
    ambiguousTitle: string;
    lowConfidenceTitle: string;
    closeScores: string;
    expertAdvice: string;
  };
  lime: {
    title: string;
    description: string;
    explainBtn: string;
    computing: string;
    recompute: string;
    explainedClass: string;
    positiveFeatures: string;
    negativeFeatures: string;
    interpretationGuide: string;
    disclaimer: string;
    featuresFound: string;
  };
  sam: {
    title: string;
    status: string;
    passThroughNotice: string;
    leafIsolated: string;
    maskOverlay: string;
    backgroundSuppressed: string;
  };
  errors: {
    cropModelUnavailable: string;
    modelLoadFailed: string;
    leafNotFound: string;
    unsuitableImage: string;
    retryBtn: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    scanLeaf: string;
    scanLeafSub: string;
    selectCropToScan: string;
    recentChecks: string;
    seeAll: string;
    confidence: string;
    match: string;
  };
  home: {
    badge: string;
    heroTitle: string;
    heroDesc: string;
    scanCropBtn: string;
    howItWorksBtn: string;
    sampleDetected: string;
    sampleConfidence: string;
    howItWorksTitle: string;
    howItWorksSubtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
    supportedCropsTitle: string;
    supportedCropsSubtitle: string;
    readyTitle: string;
    readySubtitle: string;
  };
  history: {
    title: string;
    subtitle: string;
    noHistory: string;
  };
  about: {
    title: string;
    desc: string;
    howScanWorks: string;
    methodology: string;
    researchBasis: string;
    researchDesc: string;
  };
}
