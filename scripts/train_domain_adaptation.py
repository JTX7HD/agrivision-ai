"""
AgriVision AI — Controlled Domain-Adaptation Trial (Phase C, Task 3.6.3)
========================================================================
Executes the first controlled MobileNetV3 domain adaptation experiment:
1. Stage 1: Head-only warm-up for 5 epochs (backbone strictly frozen).
2. Stage 2: Differential fine-tuning for up to 15 epochs (top 4 blocks unfrozen).
3. Early stopping on validation macro-F1 (patience = 4).
4. Full validation evaluation of baseline checkpoint vs fine-tuned candidate.
5. Preserves complete isolation from the 163-image final benchmark.
6. Saves all candidate weights, logs, and reports in training_artifacts/experiments/phase_c_3_6_3/.

Strict Non-Negotiable Restrictions:
- Never overwrite public/models/tomato_mobilenetv3_v2.onnx.
- Do not access data/benchmark/ during training, validation, or checkpoint selection.
- Zero changes to production code or confidence thresholds.
"""

import os
import sys
import json
import time
import hashlib
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
import numpy as np
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_DIR = os.path.join(REPO_ROOT, 'data', 'field_training_audit')
EXP_DIR = os.path.join(REPO_ROOT, 'training_artifacts', 'experiments', 'phase_c_3_6_3')
BENCHMARK_MANIFEST_PATH = os.path.join(REPO_ROOT, 'data', 'benchmark', 'benchmark_manifest.json')
BASELINE_PTH_PATH = os.path.join(REPO_ROOT, 'training_artifacts', 'baseline_tomato_mobilenetv3_v2.pth')
PRODUCTION_ONNX_PATH = os.path.join(REPO_ROOT, 'public', 'models', 'tomato_mobilenetv3_v2.onnx')
PRODUCTION_YOLO_PATH = os.path.join(REPO_ROOT, 'public', 'models', 'yolo11n_leaf_v1_best.onnx')

TOMATO_CLASSES = [
    { 'index': 0, 'className': 'Tomato___Bacterial_spot', 'pv_folder': 'Tomato___Bacterial_spot', 'plantdoc_folder': 'Tomato leaf bacterial spot' },
    { 'index': 1, 'className': 'Tomato___Early_blight', 'pv_folder': 'Tomato___Early_blight', 'plantdoc_folder': 'Tomato Early blight leaf' },
    { 'index': 2, 'className': 'Tomato___Late_blight', 'pv_folder': 'Tomato___Late_blight', 'plantdoc_folder': 'Tomato leaf late blight' },
    { 'index': 3, 'className': 'Tomato___Leaf_Mold', 'pv_folder': 'Tomato___Leaf_Mold', 'plantdoc_folder': 'Tomato mold leaf' },
    { 'index': 4, 'className': 'Tomato___Septoria_leaf_spot', 'pv_folder': 'Tomato___Septoria_leaf_spot', 'plantdoc_folder': 'Tomato Septoria leaf spot' },
    { 'index': 5, 'className': 'Tomato___Spider_mites Two-spotted_spider_mite', 'pv_folder': 'Tomato___Spider_mites Two-spotted_spider_mite', 'plantdoc_folder': 'Tomato two spotted spider mites leaf' },
    { 'index': 6, 'className': 'Tomato___Target_Spot', 'pv_folder': 'Tomato___Target_Spot', 'plantdoc_folder': None },
    { 'index': 7, 'className': 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'pv_folder': 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'plantdoc_folder': 'Tomato leaf yellow virus' },
    { 'index': 8, 'className': 'Tomato___Tomato_mosaic_virus', 'pv_folder': 'Tomato___Tomato_mosaic_virus', 'plantdoc_folder': 'Tomato leaf mosaic virus' },
    { 'index': 9, 'className': 'Tomato___healthy', 'pv_folder': 'Tomato___healthy', 'plantdoc_folder': 'Tomato leaf' }
]

CLASS_NAMES = [c['className'] for c in TOMATO_CLASSES]
SHORT_NAMES = ["0:BactSpot", "1:EarlyBlight", "2:LateBlight", "3:LeafMold", "4:Septoria", "5:SpiderMite", "6:TargetSpot", "7:TYLCV", "8:ToMV", "9:Healthy"]

def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def set_deterministic_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

class DomainAdaptationDataset(Dataset):
    def __init__(self, samples: List[Dict[str, Any]], transform=None, is_train: bool = True):
        self.samples = samples
        self.transform = transform
        self.is_train = is_train

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        local_path = os.path.join(REPO_ROOT, item['local_rel_path'])
        with Image.open(local_path) as im:
            image = im.convert('RGB')
        label = int(item['class_index'])
        if self.transform:
            image = self.transform(image)
        return image, label, item['class_name'], item['source'], item['local_rel_path']

def build_data_splits() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    set_deterministic_seed(42)
    
    # Clean PlantDoc Field Data
    inv_path = os.path.join(AUDIT_DIR, 'plantdoc_train_inventory.json')
    excl_path = os.path.join(AUDIT_DIR, 'benchmark_exclusion_list.json')
    
    with open(inv_path, 'r', encoding='utf-8') as f:
        inv = json.load(f)
    with open(excl_path, 'r', encoding='utf-8') as f:
        excl = json.load(f)
        
    excluded_paths = set(excl.get('excluded_relative_paths', []))
    raw_items = inv.get('items', [])
    clean_items = [it for it in raw_items if it['local_rel_path'] not in excluded_paths and not it['is_corrupt']]
    
    field_train = []
    field_val = []
    
    for c in TOMATO_CLASSES:
        c_items = [it for it in clean_items if it['class_index'] == c['index']]
        c_items.sort(key=lambda x: x['orig_filename'])
        random.shuffle(c_items)
        
        n_total = len(c_items)
        for it in c_items:
            it['source'] = 'PlantDoc_Field'
            
        if n_total == 0:
            pass
        elif n_total == 2:
            field_train.extend(c_items)
        else:
            n_val = max(1, int(round(n_total * 0.20)))
            val_c = c_items[:n_val]
            train_c = c_items[n_val:]
            field_train.extend(train_c)
            field_val.extend(val_c)
            
    # PlantVillage Anchors
    anchor_base = os.path.join(AUDIT_DIR, 'plantvillage_anchor_raw')
    target_allocations = {
        'Tomato___Bacterial_spot': (30, 10),
        'Tomato___Early_blight': (30, 10),
        'Tomato___Late_blight': (30, 10),
        'Tomato___Leaf_Mold': (30, 10),
        'Tomato___Septoria_leaf_spot': (30, 10),
        'Tomato___Spider_mites Two-spotted_spider_mite': (100, 20),
        'Tomato___Target_Spot': (100, 20),
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': (30, 10),
        'Tomato___Tomato_mosaic_virus': (30, 10),
        'Tomato___healthy': (30, 10)
    }
    
    anchor_train = []
    anchor_val = []
    
    for c in TOMATO_CLASSES:
        f_name = c['pv_folder']
        c_dir = os.path.join(anchor_base, f_name)
        fnames = sorted(os.listdir(c_dir))
        random.shuffle(fnames)
        
        n_tr, n_va = target_allocations[f_name]
        tr_f = fnames[:n_tr]
        va_f = fnames[n_tr:n_tr + n_va]
        
        for fn in tr_f:
            rel = os.path.relpath(os.path.join(c_dir, fn), REPO_ROOT).replace('\\', '/')
            anchor_train.append({
                'class_index': c['index'],
                'class_name': c['className'],
                'local_rel_path': rel,
                'source': 'PlantVillage_Anchor'
            })
            
        for fn in va_f:
            rel = os.path.relpath(os.path.join(c_dir, fn), REPO_ROOT).replace('\\', '/')
            anchor_val.append({
                'class_index': c['index'],
                'class_name': c['className'],
                'local_rel_path': rel,
                'source': 'PlantVillage_Anchor'
            })
            
    combined_train = field_train + anchor_train
    combined_val = field_val + anchor_val
    return combined_train, combined_val

def convert_to_fused(module):
    for name, child in module.named_children():
        if isinstance(child, nn.modules.conv.Conv2d):
            new_conv = nn.Conv2d(
                child.in_channels, child.out_channels, child.kernel_size,
                stride=child.stride, padding=child.padding, dilation=child.dilation,
                groups=child.groups, bias=True
            )
            setattr(module, name, new_conv)
        elif isinstance(child, nn.BatchNorm2d):
            setattr(module, name, nn.Identity())
        else:
            convert_to_fused(child)

def build_model(checkpoint_path: str) -> nn.Module:
    state_dict = torch.load(checkpoint_path, map_location='cpu')
    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, 10)
    convert_to_fused(model)
    model.load_state_dict(state_dict, strict=True)
    return model

def compute_classification_metrics(y_true: List[int], y_pred: List[int], sources: List[str]) -> Dict[str, Any]:
    """Computes comprehensive classification metrics overall, field-only, and anchor-only."""
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    sources = np.array(sources)
    
    def calc_subset_metrics(mask, prefix=""):
        if np.sum(mask) == 0:
            return {}
        yt = y_true[mask]
        yp = y_pred[mask]
        n_samples = len(yt)
        n_correct = int(np.sum(yt == yp))
        acc = round(n_correct / n_samples * 100.0, 2)
        
        # Per class precision, recall, f1
        per_class = []
        precisions, recalls, f1s = [], [], []
        
        for c in range(10):
            tp = int(np.sum((yt == c) & (yp == c)))
            fp = int(np.sum((yt != c) & (yp == c)))
            fn = int(np.sum((yt == c) & (yp != c)))
            support = int(np.sum(yt == c))
            
            p = round(tp / (tp + fp) * 100.0, 2) if (tp + fp) > 0 else 0.0
            r = round(tp / (tp + fn) * 100.0, 2) if (tp + fn) > 0 else 0.0
            f = round(2 * p * r / (p + r), 2) if (p + r) > 0 else 0.0
            
            per_class.append({
                'class_index': c,
                'class_name': CLASS_NAMES[c],
                'support': support,
                'tp': tp, 'fp': fp, 'fn': fn,
                'precision': p, 'recall': r, 'f1': f
            })
            
            if support > 0:
                precisions.append(p)
                recalls.append(r)
                f1s.append(f)
                
        macro_p = round(float(np.mean(precisions)), 2) if precisions else 0.0
        macro_r = round(float(np.mean(recalls)), 2) if recalls else 0.0
        macro_f1 = round(float(np.mean(f1s)), 2) if f1s else 0.0
        
        # Healthy metrics (class 9)
        healthy_support = int(np.sum(yt == 9))
        healthy_tp = int(np.sum((yt == 9) & (yp == 9)))
        healthy_fp = int(np.sum((yt != 9) & (yp == 9)))
        healthy_fn = int(np.sum((yt == 9) & (yp != 9)))
        healthy_recall = round(healthy_tp / max(healthy_support, 1) * 100.0, 2)
        
        # Confusion matrix
        cm = [[int(np.sum((yt == i) & (yp == j))) for j in range(10)] for i in range(10)]
        
        return {
            f'{prefix}samples': n_samples,
            f'{prefix}correct': n_correct,
            f'{prefix}accuracy': acc,
            f'{prefix}macro_precision': macro_p,
            f'{prefix}macro_recall': macro_r,
            f'{prefix}macro_f1': macro_f1,
            f'{prefix}healthy_support': healthy_support,
            f'{prefix}healthy_tp': healthy_tp,
            f'{prefix}healthy_false_alarms': healthy_fn,
            f'{prefix}healthy_recall': healthy_recall,
            f'{prefix}per_class': per_class,
            f'{prefix}confusion_matrix': cm
        }
        
    all_mask = np.ones(len(y_true), dtype=bool)
    field_mask = (sources == 'PlantDoc_Field')
    anchor_mask = (sources == 'PlantVillage_Anchor')
    
    res = {}
    res.update(calc_subset_metrics(all_mask, prefix="combined_"))
    res.update(calc_subset_metrics(field_mask, prefix="field_"))
    res.update(calc_subset_metrics(anchor_mask, prefix="anchor_"))
    return res

def evaluate_on_val_loader(model: nn.Module, loader: DataLoader, criterion: nn.Module) -> Tuple[float, Dict[str, Any]]:
    model.eval()
    val_loss = 0.0
    total = 0
    y_true, y_pred, sources = [], [], []
    
    with torch.no_grad():
        for images, labels, cnames, src, paths in loader:
            outputs = model(images)
            loss = criterion(outputs, labels)
            val_loss += loss.item() * images.size(0)
            total += labels.size(0)
            
            _, preds = torch.max(outputs, 1)
            y_true.extend(labels.tolist())
            y_pred.extend(preds.tolist())
            sources.extend(src)
            
    avg_loss = round(val_loss / max(total, 1), 4)
    metrics = compute_classification_metrics(y_true, y_pred, sources)
    return avg_loss, metrics

def run_experiment():
    os.makedirs(EXP_DIR, exist_ok=True)
    set_deterministic_seed(42)
    
    print("=" * 90)
    print("AGRIVISION AI — CONTROLLED DOMAIN-ADAPTATION EXPERIMENT (PHASE C, TASK 3.6.3)")
    print("=" * 90)
    
    # -------------------------------------------------------------------------
    # STEP 1: Freeze Configuration
    # -------------------------------------------------------------------------
    print("\n[Step 1/5] Freezing Experiment Configuration...")
    
    train_items, val_items = build_data_splits()
    
    # Verify dataset integrity
    assert len(train_items) == 977, f"Expected 977 train items, found {len(train_items)}"
    assert len(val_items) == 255, f"Expected 255 val items, found {len(val_items)}"
    
    baseline_hash = compute_sha256(BASELINE_PTH_PATH)
    prod_onnx_pre_hash = compute_sha256(PRODUCTION_ONNX_PATH)
    prod_yolo_pre_hash = compute_sha256(PRODUCTION_YOLO_PATH)
    manifest_pre_hash = compute_sha256(BENCHMARK_MANIFEST_PATH)
    
    print(f"  - Baseline Checkpoint SHA-256 : {baseline_hash}")
    print(f"  - Production ONNX SHA-256     : {prod_onnx_pre_hash}")
    print(f"  - Benchmark Manifest SHA-256  : {manifest_pre_hash}")
    print(f"  - Dataset Splits              : {len(train_items)} Train (537 Field + 440 Anchor), {len(val_items)} Val (135 Field + 120 Anchor)")
    
    # Class weights
    train_counts_by_class = {c['index']: 0 for c in TOMATO_CLASSES}
    for it in train_items:
        train_counts_by_class[it['class_index']] += 1
        
    class_weights = [len(train_items) / (10.0 * np.sqrt(train_counts_by_class[c['index']])) for c in TOMATO_CLASSES]
    class_weights_t = torch.tensor(class_weights, dtype=torch.float32)
    class_weights_t = class_weights_t / class_weights_t.mean()
    
    criterion = nn.CrossEntropyLoss(weight=class_weights_t)
    
    # Transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1, hue=0.02),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_ds = DomainAdaptationDataset(train_items, transform=train_transform, is_train=True)
    val_ds = DomainAdaptationDataset(val_items, transform=val_transform, is_train=False)
    
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=16, shuffle=False)
    
    exp_config = {
        'experiment_id': 'phase_c_task_3_6_3_domain_adaptation',
        'created_at_utc': datetime.now(timezone.utc).isoformat(),
        'random_seed': 42,
        'torch_version': torch.__version__,
        'baseline_checkpoint_sha256': baseline_hash,
        'dataset': {
            'train_samples': len(train_items),
            'field_train': sum(1 for it in train_items if it['source'] == 'PlantDoc_Field'),
            'anchor_train': sum(1 for it in train_items if it['source'] == 'PlantVillage_Anchor'),
            'val_samples': len(val_items),
            'field_val': sum(1 for it in val_items if it['source'] == 'PlantDoc_Field'),
            'anchor_val': sum(1 for it in val_items if it['source'] == 'PlantVillage_Anchor'),
            'batch_size': 16,
            'input_dimensions': [3, 224, 224]
        },
        'class_weights': [round(w.item(), 4) for w in class_weights_t],
        'stage_1': {
            'description': 'Head warm-up (backbone features 0-16 frozen)',
            'epochs': 5,
            'optimizer': 'AdamW',
            'lr': 1e-3,
            'weight_decay': 1e-4
        },
        'stage_2': {
            'description': 'Differential fine-tuning (features 13-16 unfrozen)',
            'max_epochs': 15,
            'optimizer': 'AdamW',
            'lr_backbone': 1e-5,
            'lr_head': 1e-4,
            'weight_decay': 1e-4,
            'scheduler': 'CosineAnnealingLR',
            'early_stopping_patience': 4,
            'stopping_metric': 'combined_val_macro_f1'
        }
    }
    
    with open(os.path.join(EXP_DIR, 'experiment_config.json'), 'w', encoding='utf-8') as f:
        json.dump(exp_config, f, indent=2)
    print("  Configuration frozen and saved to experiment_config.json.")
    
    # -------------------------------------------------------------------------
    # STEP 3: Baseline Evaluation (Prior to Training)
    # -------------------------------------------------------------------------
    print("\n[Step 2/5] Evaluating Untouched Baseline Checkpoint on Validation Split...")
    baseline_model = build_model(BASELINE_PTH_PATH)
    base_val_loss, base_metrics = evaluate_on_val_loader(baseline_model, val_loader, criterion)
    
    print(f"  Baseline Combined Val Acc: {base_metrics['combined_accuracy']}% | Macro-F1: {base_metrics['combined_macro_f1']}%")
    print(f"  Baseline Field Val Acc:    {base_metrics['field_accuracy']}% | Field Macro-F1: {base_metrics['field_macro_f1']}% | Healthy Recall: {base_metrics['field_healthy_recall']}%")
    print(f"  Baseline Anchor Val Acc:   {base_metrics['anchor_accuracy']}% | Anchor Macro-F1: {base_metrics['anchor_macro_f1']}%")
    
    # -------------------------------------------------------------------------
    # STEP 2: Controlled Fine-Tuning Execution
    # -------------------------------------------------------------------------
    print("\n[Step 3/5] Starting Controlled Fine-Tuning (Stage 1 & Stage 2)...")
    
    candidate_model = build_model(BASELINE_PTH_PATH)
    
    epoch_logs = []
    best_val_macro_f1 = -1.0
    best_epoch = -1
    best_checkpoint_path = os.path.join(EXP_DIR, 'best_candidate_mobilenetv3.pth')
    
    # --- STAGE 1: Head Warm-up (5 Epochs) ---
    print("\n--- STAGE 1: Classifier Head Warm-up (Epochs 1-5, Backbone Frozen) ---")
    for param in candidate_model.features.parameters():
        param.requires_grad = False
    for param in candidate_model.classifier.parameters():
        param.requires_grad = True
        
    opt_stage1 = optim.AdamW(candidate_model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)
    
    for epoch in range(1, 6):
        t0 = time.time()
        candidate_model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for images, labels, _, _, _ in train_loader:
            opt_stage1.zero_grad()
            outputs = candidate_model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            opt_stage1.step()
            
            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            train_total += labels.size(0)
            
        dur = round(time.time() - t0, 2)
        avg_train_loss = round(train_loss / max(train_total, 1), 4)
        train_acc = round(train_correct / max(train_total, 1) * 100.0, 2)
        
        val_loss, val_m = evaluate_on_val_loader(candidate_model, val_loader, criterion)
        
        # Checkpoint selection check
        is_best = False
        if val_m['combined_macro_f1'] > best_val_macro_f1:
            best_val_macro_f1 = val_m['combined_macro_f1']
            best_epoch = epoch
            is_best = True
            torch.save(candidate_model.state_dict(), best_checkpoint_path)
            
        log_entry = {
            'epoch': epoch,
            'stage': 1,
            'lr_head': 1e-3,
            'lr_backbone': 0.0,
            'duration_sec': dur,
            'train_loss': avg_train_loss,
            'train_acc': train_acc,
            'val_loss': val_loss,
            'combined_acc': val_m['combined_accuracy'],
            'combined_macro_f1': val_m['combined_macro_f1'],
            'field_acc': val_m['field_accuracy'],
            'field_macro_f1': val_m['field_macro_f1'],
            'field_healthy_recall': val_m['field_healthy_recall'],
            'field_healthy_false_alarms': val_m['field_healthy_false_alarms'],
            'anchor_acc': val_m['anchor_accuracy'],
            'anchor_macro_f1': val_m['anchor_macro_f1'],
            'is_best_checkpoint': is_best
        }
        epoch_logs.append(log_entry)
        
        print(f"  Epoch {epoch:02d}/05 [Stage 1] | Tr Loss: {avg_train_loss:.4f} Acc: {train_acc:5.2f}% | Val Loss: {val_loss:.4f} Acc: {val_m['combined_accuracy']:5.2f}% F1: {val_m['combined_macro_f1']:5.2f}% | Field Acc: {val_m['field_accuracy']:5.2f}% (H-Rec: {val_m['field_healthy_recall']:4.1f}%) | Anc Acc: {val_m['anchor_accuracy']:5.2f}% {'*' if is_best else ''} ({dur}s)")
        
    # --- STAGE 2: Differential Fine-Tuning (Up to 15 Epochs) ---
    print("\n--- STAGE 2: Differential Fine-Tuning (Features 13-16 Unfrozen, Max 15 Epochs) ---")
    
    # Load best weights from Stage 1
    candidate_model.load_state_dict(torch.load(best_checkpoint_path, map_location='cpu'))
    
    # Unfreeze features 13 to 16
    for i in range(13):
        for param in candidate_model.features[i].parameters():
            param.requires_grad = False
    for i in range(13, len(candidate_model.features)):
        for param in candidate_model.features[i].parameters():
            param.requires_grad = True
    for param in candidate_model.classifier.parameters():
        param.requires_grad = True
        
    backbone_params = [p for i in range(13, len(candidate_model.features)) for p in candidate_model.features[i].parameters()]
    head_params = list(candidate_model.classifier.parameters())
    
    opt_stage2 = optim.AdamW([
        {'params': backbone_params, 'lr': 1e-5},
        {'params': head_params, 'lr': 1e-4}
    ], weight_decay=1e-4)
    
    scheduler = optim.lr_scheduler.CosineAnnealingLR(opt_stage2, T_max=15, eta_min=1e-6)
    
    patience = 4
    no_improve_count = 0
    
    for epoch_idx in range(1, 16):
        epoch = 5 + epoch_idx
        t0 = time.time()
        candidate_model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for images, labels, _, _, _ in train_loader:
            opt_stage2.zero_grad()
            outputs = candidate_model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            opt_stage2.step()
            
            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            train_total += labels.size(0)
            
        scheduler.step()
        dur = round(time.time() - t0, 2)
        avg_train_loss = round(train_loss / max(train_total, 1), 4)
        train_acc = round(train_correct / max(train_total, 1) * 100.0, 2)
        
        val_loss, val_m = evaluate_on_val_loader(candidate_model, val_loader, criterion)
        
        is_best = False
        if val_m['combined_macro_f1'] > best_val_macro_f1:
            best_val_macro_f1 = val_m['combined_macro_f1']
            best_epoch = epoch
            is_best = True
            no_improve_count = 0
            torch.save(candidate_model.state_dict(), best_checkpoint_path)
        else:
            no_improve_count += 1
            
        lr_bb = opt_stage2.param_groups[0]['lr']
        lr_hd = opt_stage2.param_groups[1]['lr']
        
        log_entry = {
            'epoch': epoch,
            'stage': 2,
            'lr_head': lr_hd,
            'lr_backbone': lr_bb,
            'duration_sec': dur,
            'train_loss': avg_train_loss,
            'train_acc': train_acc,
            'val_loss': val_loss,
            'combined_acc': val_m['combined_accuracy'],
            'combined_macro_f1': val_m['combined_macro_f1'],
            'field_acc': val_m['field_accuracy'],
            'field_macro_f1': val_m['field_macro_f1'],
            'field_healthy_recall': val_m['field_healthy_recall'],
            'field_healthy_false_alarms': val_m['field_healthy_false_alarms'],
            'anchor_acc': val_m['anchor_accuracy'],
            'anchor_macro_f1': val_m['anchor_macro_f1'],
            'is_best_checkpoint': is_best
        }
        epoch_logs.append(log_entry)
        
        print(f"  Epoch {epoch:02d}/20 [Stage 2] | Tr Loss: {avg_train_loss:.4f} Acc: {train_acc:5.2f}% | Val Loss: {val_loss:.4f} Acc: {val_m['combined_accuracy']:5.2f}% F1: {val_m['combined_macro_f1']:5.2f}% | Field Acc: {val_m['field_accuracy']:5.2f}% (H-Rec: {val_m['field_healthy_recall']:4.1f}%) | Anc Acc: {val_m['anchor_accuracy']:5.2f}% {'*' if is_best else ''} ({dur}s)")
        
        if no_improve_count >= patience:
            print(f"\n  Early stopping triggered: No validation macro-F1 improvement for {patience} consecutive epochs.")
            break
            
    print(f"\n  Training completed. Best Checkpoint selected from Epoch {best_epoch} with Val Macro-F1 = {best_val_macro_f1:.2f}%.")
    
    # -------------------------------------------------------------------------
    # STEP 3 & 4: Deep Evaluation of Selected Candidate vs Baseline
    # -------------------------------------------------------------------------
    print("\n[Step 4/5] Executing Deep Comparative Evaluation (Baseline vs Best Candidate)...")
    
    best_candidate_model = build_model(best_checkpoint_path)
    cand_val_loss, cand_metrics = evaluate_on_val_loader(best_candidate_model, val_loader, criterion)
    
    # Save logs and metrics
    with open(os.path.join(EXP_DIR, 'epoch_training_logs.json'), 'w', encoding='utf-8') as f:
        json.dump(epoch_logs, f, indent=2)
        
    comparison_results = {
        'best_checkpoint_epoch': best_epoch,
        'best_checkpoint_path': os.path.relpath(best_checkpoint_path, REPO_ROOT).replace('\\', '/'),
        'best_checkpoint_sha256': compute_sha256(best_checkpoint_path),
        'baseline_checkpoint_sha256': baseline_hash,
        'metrics_summary': {
            'overall_accuracy': {
                'baseline': base_metrics['combined_accuracy'],
                'candidate': cand_metrics['combined_accuracy'],
                'delta_pp': round(cand_metrics['combined_accuracy'] - base_metrics['combined_accuracy'], 2)
            },
            'overall_macro_f1': {
                'baseline': base_metrics['combined_macro_f1'],
                'candidate': cand_metrics['combined_macro_f1'],
                'delta_pp': round(cand_metrics['combined_macro_f1'] - base_metrics['combined_macro_f1'], 2)
            },
            'field_accuracy': {
                'baseline': base_metrics['field_accuracy'],
                'candidate': cand_metrics['field_accuracy'],
                'delta_pp': round(cand_metrics['field_accuracy'] - base_metrics['field_accuracy'], 2)
            },
            'field_macro_f1': {
                'baseline': base_metrics['field_macro_f1'],
                'candidate': cand_metrics['field_macro_f1'],
                'delta_pp': round(cand_metrics['field_macro_f1'] - base_metrics['field_macro_f1'], 2)
            },
            'field_healthy_recall': {
                'baseline': base_metrics['field_healthy_recall'],
                'candidate': cand_metrics['field_healthy_recall'],
                'delta_pp': round(cand_metrics['field_healthy_recall'] - base_metrics['field_healthy_recall'], 2)
            },
            'field_healthy_false_alarms': {
                'baseline': base_metrics['field_healthy_false_alarms'],
                'candidate': cand_metrics['field_healthy_false_alarms'],
                'delta': cand_metrics['field_healthy_false_alarms'] - base_metrics['field_healthy_false_alarms']
            },
            'anchor_accuracy': {
                'baseline': base_metrics['anchor_accuracy'],
                'candidate': cand_metrics['anchor_accuracy'],
                'delta_pp': round(cand_metrics['anchor_accuracy'] - base_metrics['anchor_accuracy'], 2)
            },
            'anchor_macro_f1': {
                'baseline': base_metrics['anchor_macro_f1'],
                'candidate': cand_metrics['anchor_macro_f1'],
                'delta_pp': round(cand_metrics['anchor_macro_f1'] - base_metrics['anchor_macro_f1'], 2)
            }
        },
        'per_class_comparison': [],
        'baseline_full_metrics': base_metrics,
        'candidate_full_metrics': cand_metrics
    }
    
    for c in range(10):
        b_p = base_metrics['combined_per_class'][c]
        c_p = cand_metrics['combined_per_class'][c]
        comparison_results['per_class_comparison'].append({
            'class_index': c,
            'class_name': CLASS_NAMES[c],
            'support': b_p['support'],
            'baseline_recall': b_p['recall'],
            'candidate_recall': c_p['recall'],
            'recall_delta_pp': round(c_p['recall'] - b_p['recall'], 2),
            'baseline_precision': b_p['precision'],
            'candidate_precision': c_p['precision'],
            'precision_delta_pp': round(c_p['precision'] - b_p['precision'], 2),
            'baseline_f1': b_p['f1'],
            'candidate_f1': c_p['f1'],
            'f1_delta_pp': round(c_p['f1'] - b_p['f1'], 2)
        })
        
    with open(os.path.join(EXP_DIR, 'baseline_vs_candidate_metrics.json'), 'w', encoding='utf-8') as f:
        json.dump(comparison_results, f, indent=2)
    print("  Comparison results saved to baseline_vs_candidate_metrics.json.")
    
    # -------------------------------------------------------------------------
    # STEP 5: Verification of Production Assets
    # -------------------------------------------------------------------------
    print("\n[Step 5/5] Cryptographic Verification of Production Assets & Benchmark...")
    prod_onnx_post_hash = compute_sha256(PRODUCTION_ONNX_PATH)
    prod_yolo_post_hash = compute_sha256(PRODUCTION_YOLO_PATH)
    manifest_post_hash = compute_sha256(BENCHMARK_MANIFEST_PATH)
    
    assert prod_onnx_pre_hash == prod_onnx_post_hash, "Production classifier ONNX was modified!"
    assert prod_yolo_pre_hash == prod_yolo_post_hash, "Production YOLO detector ONNX was modified!"
    assert manifest_pre_hash == manifest_post_hash, "Benchmark manifest was modified!"
    
    print(f"  - Production ONNX SHA-256    : {prod_onnx_post_hash} (100% UNCHANGED)")
    print(f"  - Production YOLO SHA-256    : {prod_yolo_post_hash} (100% UNCHANGED)")
    print(f"  - Benchmark Manifest SHA-256 : {manifest_post_hash} (100% UNCHANGED)")
    
    print("\n" + "=" * 90)
    print("CONTROLLED DOMAIN-ADAPTATION TRIAL COMPLETED SUCCESSFULLY")
    print("=" * 90)

if __name__ == '__main__':
    run_experiment()
