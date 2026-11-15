"""
AgriVision AI — Field Training Data Preparation and Leakage Audit (Phase C, Task 3.6)
=====================================================================================
Extracts official PlantDoc tomato training images from the official repository,
audits readability/corruption, verifies SHA-256 and perceptual hashes, conducts
rigorous data leakage screening against the 163-image benchmark, and compiles
a comprehensive audit inventory.

Strict Restrictions Enforced:
- No weights, thresholds, production code, or benchmark data modified.
- Original benchmark manifest remains strictly read-only.
- All outputs saved to data/field_training_audit/.
- No fine-tuning or training performed.
"""

import os
import sys
import json
import time
import hashlib
import subprocess
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import numpy as np
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_REPO = os.path.join(REPO_ROOT, 'data', 'field_training_audit', 'temp_plantdoc_repo')
AUDIT_DIR = os.path.join(REPO_ROOT, 'data', 'field_training_audit')
RAW_TRAIN_DIR = os.path.join(AUDIT_DIR, 'plantdoc_train_raw')
BENCHMARK_MANIFEST_PATH = os.path.join(REPO_ROOT, 'data', 'benchmark', 'benchmark_manifest.json')

# Exact 10 tomato disease classes matching classMapper.ts
TOMATO_CLASSES = [
    { 'index': 0, 'className': 'Tomato___Bacterial_spot', 'displayName': 'Tomato Bacterial Spot', 'plantdoc_folder': 'Tomato leaf bacterial spot' },
    { 'index': 1, 'className': 'Tomato___Early_blight', 'displayName': 'Tomato Early Blight', 'plantdoc_folder': 'Tomato Early blight leaf' },
    { 'index': 2, 'className': 'Tomato___Late_blight', 'displayName': 'Tomato Late Blight', 'plantdoc_folder': 'Tomato leaf late blight' },
    { 'index': 3, 'className': 'Tomato___Leaf_Mold', 'displayName': 'Tomato Leaf Mold', 'plantdoc_folder': 'Tomato mold leaf' },
    { 'index': 4, 'className': 'Tomato___Septoria_leaf_spot', 'displayName': 'Tomato Septoria Leaf Spot', 'plantdoc_folder': 'Tomato Septoria leaf spot' },
    { 'index': 5, 'className': 'Tomato___Spider_mites Two-spotted_spider_mite', 'displayName': 'Two-Spotted Spider Mite', 'plantdoc_folder': 'Tomato two spotted spider mites leaf' },
    { 'index': 6, 'className': 'Tomato___Target_Spot', 'displayName': 'Tomato Target Spot', 'plantdoc_folder': None },
    { 'index': 7, 'className': 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'displayName': 'Tomato Yellow Leaf Curl', 'plantdoc_folder': 'Tomato leaf yellow virus' },
    { 'index': 8, 'className': 'Tomato___Tomato_mosaic_virus', 'displayName': 'Tomato Mosaic Virus', 'plantdoc_folder': 'Tomato leaf mosaic virus' },
    { 'index': 9, 'className': 'Tomato___healthy', 'displayName': 'Healthy Tomato', 'plantdoc_folder': 'Tomato leaf' }
]

FOLDER_TO_CLASS = {c['plantdoc_folder']: c for c in TOMATO_CLASSES if c['plantdoc_folder']}

def sanitize_filename(filename: str) -> str:
    """Sanitize invalid Windows filename characters."""
    invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*', '&', '=', '%']
    s = filename
    for ch in invalid_chars:
        s = s.replace(ch, '_')
    # Limit length if needed
    if len(s) > 120:
        base, ext = os.path.splitext(s)
        h = hashlib.sha256(filename.encode()).hexdigest()[:8]
        s = f"{base[:100]}_{h}{ext}"
    return s

def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def compute_file_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def dct2_matrix(N=32):
    """Generates standard 2D DCT orthonormal transform matrix."""
    n = np.arange(N)
    k = n.reshape((N, 1))
    M = np.cos(np.pi / N * (n + 0.5) * k)
    M[0, :] /= np.sqrt(2)
    M *= np.sqrt(2.0 / N)
    return M

DCT32 = dct2_matrix(32)

def compute_phash(img: Image.Image) -> str:
    """Computes standard 64-bit DCT-based perceptual hash."""
    im = img.convert('L').resize((32, 32), Image.Resampling.BILINEAR)
    arr = np.asarray(im, dtype=np.float32)
    dct = DCT32 @ arr @ DCT32.T
    # Low-frequency 8x8 block (exclude DC at [0,0])
    block = dct[:8, :8]
    median = np.median(block.flatten()[1:])
    bits = block > median
    # Convert 64 boolean bits to hex
    bit_str = ''.join(['1' if b else '0' for b in bits.flatten()])
    return f"{int(bit_str, 2):016x}"

def compute_dhash(img: Image.Image) -> str:
    """Computes 64-bit difference hash (dHash)."""
    im = img.convert('L').resize((9, 8), Image.Resampling.BILINEAR)
    arr = np.asarray(im, dtype=np.int32)
    diff = arr[:, 1:] > arr[:, :-1]
    bit_str = ''.join(['1' if b else '0' for b in diff.flatten()])
    return f"{int(bit_str, 2):016x}"

def hamming_distance(hex1: str, hex2: str) -> int:
    val1 = int(hex1, 16)
    val2 = int(hex2, 16)
    return bin(val1 ^ val2).count('1')

def extract_plantdoc_train_blobs() -> List[Dict[str, Any]]:
    """Extracts all tomato training images directly from git object database."""
    print("\n[Step 1/5] Querying git object tree for train/Tomato*...")
    cmd = ['git', '-C', TEMP_REPO, 'ls-tree', '-r', 'HEAD:train']
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    
    records = []
    lines = res.stdout.strip().split('\n')
    for line in lines:
        if not line.strip():
            continue
        # Format: <mode> blob <hash>\t<path>
        parts = line.strip().split('\t', 1)
        if len(parts) != 2:
            continue
        meta, orig_path = parts
        meta_parts = meta.split()
        if len(meta_parts) < 3 or meta_parts[1] != 'blob':
            continue
        blob_hash = meta_parts[2]
        
        # Check if in tomato folder
        folder = orig_path.split('/')[0] if '/' in orig_path else ''
        if folder in FOLDER_TO_CLASS:
            records.append({
                'blob_hash': blob_hash,
                'orig_train_path': orig_path,
                'folder': folder,
                'filename': os.path.basename(orig_path),
                'class_info': FOLDER_TO_CLASS[folder]
            })
            
    print(f"  Found {len(records)} tomato train files in git object database across {len(set(r['folder'] for r in records))} folders.")
    return records

def dump_and_audit_images(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Dumps blob content from git, verifies readability, computes sha256 & perceptual hashes."""
    print("\n[Step 2/5] Extracting, verifying integrity, and computing hashes...")
    os.makedirs(RAW_TRAIN_DIR, exist_ok=True)
    
    audited = []
    corrupted_count = 0
    
    for idx, r in enumerate(records):
        folder_dir = os.path.join(RAW_TRAIN_DIR, r['folder'])
        os.makedirs(folder_dir, exist_ok=True)
        
        safe_fname = sanitize_filename(r['filename'])
        target_path = os.path.join(folder_dir, safe_fname)
        
        # Save file to disk if not already extracted
        if os.path.exists(target_path):
            with open(target_path, 'rb') as f:
                blob_data = f.read()
        else:
            cat_cmd = ['git', '-C', TEMP_REPO, 'cat-file', '-p', r['blob_hash']]
            blob_res = subprocess.run(cat_cmd, capture_output=True, check=True)
            blob_data = blob_res.stdout
            with open(target_path, 'wb') as f:
                f.write(blob_data)
            
        sha256 = compute_sha256(blob_data)
        file_size = len(blob_data)
        
        # Audit image readability with PIL
        is_corrupt = False
        width, height = 0, 0
        img_format = None
        phash_str = None
        dhash_str = None
        error_msg = None
        
        try:
            with Image.open(target_path) as im:
                im.verify()
            # Reopen to read pixels & compute perceptual hashes
            with Image.open(target_path) as im:
                img_format = im.format
                width, height = im.size
                im_rgb = im.convert('RGB')
                phash_str = compute_phash(im_rgb)
                dhash_str = compute_dhash(im_rgb)
        except Exception as e:
            is_corrupt = True
            corrupted_count += 1
            error_msg = str(e)
            
        audited.append({
            'index': idx,
            'class_index': r['class_info']['index'],
            'class_name': r['class_info']['className'],
            'display_name': r['class_info']['displayName'],
            'plantdoc_folder': r['folder'],
            'orig_filename': r['filename'],
            'safe_filename': safe_fname,
            'local_rel_path': os.path.relpath(target_path, REPO_ROOT).replace('\\', '/'),
            'file_size_bytes': file_size,
            'sha256': sha256,
            'git_blob_hash': r['blob_hash'],
            'is_corrupt': is_corrupt,
            'error_message': error_msg,
            'width': width,
            'height': height,
            'aspect_ratio': round(width / max(height, 1), 3),
            'img_format': img_format,
            'phash': phash_str,
            'dhash': dhash_str
        })
        
    print(f"  Successfully processed {len(audited)} images. Corrupt/unreadable count: {corrupted_count}")
    return audited

def load_and_hash_benchmark() -> List[Dict[str, Any]]:
    """Loads all 163 benchmark images and computes perceptual hashes for leakage screening."""
    print("\n[Step 3/5] Loading benchmark manifest and computing benchmark perceptual hashes...")
    with open(BENCHMARK_MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
        
    benchmark_items = []
    records = manifest.get('records', manifest.get('images', []))
    for item in records:
        img_rel_path = item.get('relative_path') or item.get('image_path')
        img_abs_path = os.path.join(REPO_ROOT, img_rel_path)
        
        phash_str = None
        dhash_str = None
        try:
            with Image.open(img_abs_path) as im:
                im_rgb = im.convert('RGB')
                phash_str = compute_phash(im_rgb)
                dhash_str = compute_dhash(im_rgb)
        except Exception as e:
            print(f"  Warning: could not read benchmark image {img_rel_path}: {e}")
            
        benchmark_items.append({
            'id': item['id'],
            'source': item.get('dataset_source') or item.get('source'),
            'image_path': img_rel_path,
            'filename': item.get('filename') or os.path.basename(img_rel_path),
            'class_name': item.get('mapped_class_name') or item.get('ground_truth_class_name'),
            'sha256': item['sha256'],
            'phash': phash_str,
            'dhash': dhash_str
        })
        
    pv_count = sum(1 for b in benchmark_items if b['source'] == 'PlantVillage')
    pd_count = sum(1 for b in benchmark_items if b['source'] == 'PlantDoc')
    print(f"  Loaded {len(benchmark_items)} benchmark images ({pd_count} PlantDoc, {pv_count} PlantVillage).")
    return benchmark_items

def run_leakage_audit(
    train_items: List[Dict[str, Any]], 
    benchmark_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Rigorous comparison for exact SHA-256 duplicates, perceptual near-duplicates, and filename overlaps."""
    print("\n[Step 4/5] Executing multi-layer data leakage screening...")
    
    benchmark_sha_map = {b['sha256']: b for b in benchmark_items}
    benchmark_fname_map = {b['filename'].lower(): b for b in benchmark_items}
    
    exact_duplicates = []
    near_duplicates = []
    filename_collisions = []
    
    for t in train_items:
        # 1. Exact SHA-256 match
        if t['sha256'] in benchmark_sha_map:
            b = benchmark_sha_map[t['sha256']]
            exact_duplicates.append({
                'train_item': t['orig_filename'],
                'train_path': t['local_rel_path'],
                'train_class': t['class_name'],
                'benchmark_id': b['id'],
                'benchmark_path': b['image_path'],
                'benchmark_class': b['class_name'],
                'sha256': t['sha256'],
                'reason': 'EXACT_SHA256_MATCH'
            })
            
        # 2. Filename collision (normalized)
        t_fname_clean = t['orig_filename'].split('?')[0].lower()
        for b in benchmark_items:
            b_fname_clean = b['filename'].split('?')[0].lower()
            if t_fname_clean == b_fname_clean or (len(t_fname_clean) > 8 and t_fname_clean in b_fname_clean):
                if t['sha256'] != b['sha256']: # Only if not already caught by exact SHA
                    filename_collisions.append({
                        'train_item': t['orig_filename'],
                        'train_path': t['local_rel_path'],
                        'train_class': t['class_name'],
                        'benchmark_id': b['id'],
                        'benchmark_path': b['image_path'],
                        'benchmark_class': b['class_name'],
                        'reason': 'FILENAME_METADATA_OVERLAP'
                    })
                    
        # 3. Perceptual hash screening
        if t['phash'] and t['dhash']:
            for b in benchmark_items:
                if not b['phash'] or not b['dhash']:
                    continue
                p_dist = hamming_distance(t['phash'], b['phash'])
                d_dist = hamming_distance(t['dhash'], b['dhash'])
                
                # Near-duplicate threshold: both distances <= 8 or p_dist <= 5
                if p_dist <= 6 or (p_dist <= 10 and d_dist <= 8):
                    near_duplicates.append({
                        'train_item': t['orig_filename'],
                        'train_path': t['local_rel_path'],
                        'train_class': t['class_name'],
                        'benchmark_id': b['id'],
                        'benchmark_path': b['image_path'],
                        'benchmark_class': b['class_name'],
                        'phash_hamming_distance': p_dist,
                        'dhash_hamming_distance': d_dist,
                        'exact_sha256_match': t['sha256'] == b['sha256'],
                        'verdict': 'CONFIRMED_DUPLICATE' if (p_dist == 0 and d_dist == 0) else 'FLAGGED_NEAR_DUPLICATE_FOR_REVIEW'
                    })
                    
    print(f"  Exact SHA-256 Duplicates with Benchmark: {len(exact_duplicates)}")
    print(f"  Perceptual Near-Duplicates Flagged:      {len(near_duplicates)}")
    print(f"  Filename Overlaps Detected:             {len(filename_collisions)}")
    
    return {
        'exact_duplicates_count': len(exact_duplicates),
        'exact_duplicates': exact_duplicates,
        'near_duplicates_count': len(near_duplicates),
        'near_duplicates': near_duplicates,
        'filename_collisions_count': len(filename_collisions),
        'filename_collisions': filename_collisions,
        'leakage_detected': (len(exact_duplicates) > 0 or len(near_duplicates) > 0)
    }

def main():
    print("=" * 85)
    print("AGRIVISION AI — FIELD TRAINING DATA PREPARATION & LEAKAGE AUDIT (TASK 3.6)")
    print("=" * 85)
    
    start_time = time.time()
    
    # 1. Extract blobs from git object database
    records = extract_plantdoc_train_blobs()
    
    # 2. Extract and audit images
    train_items = dump_and_audit_images(records)
    
    # 3. Load benchmark and compute hashes
    benchmark_items = load_and_hash_benchmark()
    
    # 4. Leakage audit
    leakage_results = run_leakage_audit(train_items, benchmark_items)
    
    # 5. Class compatibility and inventory
    print("\n[Step 5/5] Compiling Class Compatibility, Imbalance, and Artifacts...")
    
    class_inventory = []
    total_valid = 0
    total_corrupt = 0
    
    for c in TOMATO_CLASSES:
        c_items = [t for t in train_items if t['class_index'] == c['index']]
        c_valid = [t for t in c_items if not t['is_corrupt']]
        c_corrupt = [t for t in c_items if t['is_corrupt']]
        
        # Check leakage exclusions for this class
        c_exact_leakage = [e for e in leakage_results['exact_duplicates'] if e['train_class'] == c['className']]
        c_near_leakage = [n for n in leakage_results['near_duplicates'] if n['train_class'] == c['className']]
        
        total_valid += len(c_valid)
        total_corrupt += len(c_corrupt)
        
        class_inventory.append({
            'class_index': c['index'],
            'class_name': c['className'],
            'display_name': c['displayName'],
            'plantdoc_folder': c['plantdoc_folder'],
            'official_plantdoc_train_count': len(c_items),
            'valid_readable_images': len(c_valid),
            'corrupt_images': len(c_corrupt),
            'benchmark_exact_leakage_count': len(c_exact_leakage),
            'benchmark_near_leakage_count': len(c_near_leakage),
            'clean_usable_train_candidates': len(c_valid) - len(c_exact_leakage),
            'field_representation_assessment': (
                "ADEQUATE (>50 samples)" if len(c_valid) >= 50 else
                "MODERATE (20-49 samples)" if len(c_valid) >= 20 else
                "CRITICALLY DEFICIENT (<20 samples)" if len(c_valid) > 0 else
                "COMPLETELY MISSING (0 samples in PlantDoc)"
            )
        })
        
    print("\n--- CLASS INVENTORY & COMPATIBILITY SUMMARY ---")
    for ci in class_inventory:
        print(f"  Class {ci['class_index']} ({ci['class_name']}): {ci['official_plantdoc_train_count']} train images | Clean Usable: {ci['clean_usable_train_candidates']} | {ci['field_representation_assessment']}")
        
    # Save Inventory JSON
    inventory_file = os.path.join(AUDIT_DIR, 'plantdoc_train_inventory.json')
    with open(inventory_file, 'w', encoding='utf-8') as f:
        json.dump({
            'meta': {
                'timestamp_utc': datetime.now(timezone.utc).isoformat(),
                'source_dataset': 'PlantDoc (Official Cropped Classification Dataset)',
                'source_repo': 'https://github.com/pratikkayal/PlantDoc-Dataset',
                'license': 'CC BY 4.0',
                'total_plantdoc_tomato_train_files': len(train_items),
                'total_valid_readable': total_valid,
                'total_corrupted': total_corrupt
            },
            'class_inventory': class_inventory,
            'items': train_items
        }, f, indent=2)
    print(f"\nSaved inventory to: {inventory_file}")
    
    # Save Leakage Audit JSON
    leakage_file = os.path.join(AUDIT_DIR, 'leakage_audit.json')
    with open(leakage_file, 'w', encoding='utf-8') as f:
        json.dump(leakage_results, f, indent=2)
    print(f"Saved leakage audit to: {leakage_file}")
    
    # Save Exclusion List
    exclusion_file = os.path.join(AUDIT_DIR, 'benchmark_exclusion_list.json')
    exclusion_set = set()
    for e in leakage_results['exact_duplicates']:
        exclusion_set.add(e['train_path'])
    for n in leakage_results['near_duplicates']:
        if n['verdict'] == 'CONFIRMED_DUPLICATE' or n['phash_hamming_distance'] <= 3:
            exclusion_set.add(n['train_path'])
            
    with open(exclusion_file, 'w', encoding='utf-8') as f:
        json.dump({
            'description': 'Images from PlantDoc train split that must be strictly excluded from fine-tuning to prevent data leakage into the 163-image benchmark.',
            'total_excluded': len(exclusion_set),
            'excluded_relative_paths': sorted(list(exclusion_set)),
            'exact_duplicates': leakage_results['exact_duplicates'],
            'flagged_near_duplicates_for_review': leakage_results['near_duplicates']
        }, f, indent=2)
    print(f"Saved exclusion list ({len(exclusion_set)} items) to: {exclusion_file}")
    
    elapsed = time.time() - start_time
    print(f"\nAudit completed in {elapsed:.2f} seconds.")
    print("=" * 85)

if __name__ == '__main__':
    main()
