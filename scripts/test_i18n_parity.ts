import { DICTIONARIES } from '../src/i18n/i18nContext';
import { SUPPORTED_LANGUAGES, type Locale } from '../src/i18n/types';
import { en } from '../src/i18n/locales/en';

console.log('===========================================================');
console.log('AgriVision AI — Automated 22 Scheduled Languages Parity Test');
console.log('===========================================================');

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

// 1. Verify exact 23 supported languages (22 Scheduled Indian Languages + English Default)
assert(SUPPORTED_LANGUAGES.length === 23, `Exactly 23 languages configured (found ${SUPPORTED_LANGUAGES.length})`);

const scheduledLangs = SUPPORTED_LANGUAGES.filter(l => l.isOfficialScheduled);
assert(scheduledLangs.length === 22, `Exactly 22 official Eighth Schedule languages marked (found ${scheduledLangs.length})`);

const expectedCodes: Locale[] = [
  'en', 'as', 'bn', 'brx', 'doi', 'gu', 'hi',
  'kn', 'ks', 'kok', 'mai', 'ml', 'mni', 'mr',
  'ne', 'or', 'pa', 'sa', 'sat', 'sd', 'ta',
  'te', 'ur'
];

for (const code of expectedCodes) {
  const langMeta = SUPPORTED_LANGUAGES.find(l => l.code === code);
  assert(langMeta !== undefined, `Language code '${code}' exists in SUPPORTED_LANGUAGES`);
  assert(DICTIONARIES[code] !== undefined, `Dictionary for '${code}' is registered in DICTIONARIES`);
  assert(Boolean(langMeta?.nativeName && langMeta.nativeName.trim().length > 0), `'${code}' has non-empty native script name: ${langMeta?.nativeName}`);
}

// 2. Verify Right-to-Left (RTL) configuration
const rtlCodes: Locale[] = ['ur', 'ks', 'sd'];
for (const rtlCode of rtlCodes) {
  const meta = SUPPORTED_LANGUAGES.find(l => l.code === rtlCode);
  assert(meta?.dir === 'rtl', `Language '${rtlCode}' (${meta?.name}) correctly configured as dir="rtl"`);
}

const ltrCodes = expectedCodes.filter(c => !rtlCodes.includes(c));
for (const ltrCode of ltrCodes) {
  const meta = SUPPORTED_LANGUAGES.find(l => l.code === ltrCode);
  assert(meta?.dir === 'ltr', `Language '${ltrCode}' (${meta?.name}) correctly configured as dir="ltr"`);
}

// 3. Deep Key Parity Test against English Reference Schema
const sections = Object.keys(en) as Array<keyof typeof en>;
console.log(`\nVerifying key parity across ${sections.length} dictionary sections: [${sections.join(', ')}]...`);

for (const code of expectedCodes) {
  const dict = DICTIONARIES[code];
  assert(dict !== undefined, `Locale dictionary '${code}' exists`);

  for (const section of sections) {
    assert(dict[section] !== undefined, `[${code}] has section '${section}'`);
    const refKeys = Object.keys(en[section]);
    const targetKeys = Object.keys(dict[section]);

    for (const key of refKeys) {
      const val = (dict[section] as any)[key];
      const hasKey = val !== undefined && val !== null;
      assert(hasKey, `[${code}.${section}.${key}] key is present`);
      assert(typeof val === 'string' && val.trim().length > 0, `[${code}.${section}.${key}] is non-empty string`);
    }

    assert(refKeys.length === targetKeys.length, `[${code}.${section}] has exact key count (${refKeys.length}) matching reference`);
  }
}

// 4. Missing-Key Detection Test
function detectMissingKeys(targetDict: any, refDict: any, prefix = ''): string[] {
  const missing: string[] = [];
  for (const k of Object.keys(refDict)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (targetDict[k] === undefined || targetDict[k] === null) {
      missing.push(fullPath);
    } else if (typeof refDict[k] === 'object' && !Array.isArray(refDict[k])) {
      missing.push(...detectMissingKeys(targetDict[k], refDict[k], fullPath));
    }
  }
  return missing;
}

const simulatedIncomplete = { nav: { home: 'Home' } };
const detectedMissing = detectMissingKeys(simulatedIncomplete, en);
assert(detectedMissing.length > 10, `Missing-key detection successfully caught ${detectedMissing.length} missing keys in incomplete dictionary`);

for (const code of expectedCodes) {
  const missing = detectMissingKeys(DICTIONARIES[code], en);
  assert(missing.length === 0, `Locale '${code}' has ZERO missing keys (verified 100% complete parity)`);
}

console.log('\n===========================================================');
console.log(`ALL ${passed}/${total} LOCALIZATION PARITY TESTS PASSED SUCCESSFULLY!`);
console.log('===========================================================');
