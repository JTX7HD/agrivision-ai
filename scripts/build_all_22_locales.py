# -*- coding: utf-8 -*-
"""
AgriVision AI — Production Multilingual Dictionary Builder
=========================================================
Generates all 21 remaining Eighth Schedule Indian language translation dictionaries
in TypeScript format under src/i18n/locales/.
Preserves existing en.ts and hi.ts completely.
"""

import os
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(ROOT_DIR, 'src', 'i18n', 'locales')
os.makedirs(LOCALES_DIR, exist_ok=True)

# Base template dictionary in English to ensure 100% key parity
def create_locale_ts(code, d):
    content = [
        "import type { TranslationDictionary } from '../types';",
        "",
        f"export const {code}: TranslationDictionary = {json.dumps(d, ensure_ascii=False, indent=2)};",
        ""
    ]
    filepath = os.path.join(LOCALES_DIR, f"{code}.ts")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("\n".join(content))
    print(f"Generated {filepath}")

# Full 21 language data
# (Each language has authentic terminology in its native script with full key parity)
exec(open(os.path.join(ROOT_DIR, 'scripts', 'locales_data.py'), encoding='utf-8').read())
