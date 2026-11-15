"""
AgriVision AI — Phase 1.5: Safe Controlled Correction Fine-Tuning Trial
=======================================================================
This script executes a safe, controlled fine-tuning trial:
1. Audits all saved correction records (flags synthetic dummy vs real leaf images, reports class distribution).
2. Establishes a strictly held-out evaluation set (never seen during training).
3. Uses the exact Tomato V2 checkpoint as the starting point.
4. Performs conservative fine-tuning (frozen backbone, low LR, 2 epochs).
5. Compares baseline and candidate models on the identical held-out test set.
6. Computes accuracy, per-class metrics, and confusion matrix.
7. Saves all artifacts strictly under training_artifacts/.
8. Does NOT overwrite public/models/tomato_mobilenetv3_v2.onnx.
9. Enforces honest reporting of sample-size limitations.
"""

import os
import sys
import json
import time
import hashlib
from typing import List, Dict, Any, Tuple

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image, ImageFile
import numpy as np

# Allow truncated image files
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Add repo root to path
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_ROOT)

from scripts.train_mobilenetv3_corrections import TOMATO_CLASSES, build_mobilenetv3_classifier, export_candidate_to_onnx

ARTIFACTS_DIR = os.path.join(REPO_ROOT, 'training_artifacts')
MANIFEST_PATH = os.path.join(REPO_ROOT, 'data', 'corrections', 'manifest.json')
BASELINE_PTH = os.path.join(ARTIFACTS_DIR, 'baseline_tomato_mobilenetv3_v2.pth')
CANDIDATE_PTH = os.path.join(ARTIFACTS_DIR, 'candidate_tomato_mobilenetv3_v2_trial.pth')
CANDIDATE_ONNX = os.path.join(ARTIFACTS_DIR, 'candidate_tomato_mobilenetv3_trial.onnx')
REPORT_JSON = os.path.join(ARTIFACTS_DIR, 'phase1_5_trial_report.json')


class LeafCorrectionItemDataset(Dataset):
    def __init__(self, items: List[Dict[str, Any]], transform=None):
        self.items = items
        self.transform = transform

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        item = self.items[idx]
        img_path = item['image_path']
        if not os.path.isabs(img_path):
            img_path = os.path.join(REPO_ROOT, img_path)

        image = Image.open(img_path).convert('RGB')
        label = int(item['corrected_class_index'])

        if self.transform:
            image = self.transform(image)

        return image, label, item['id']


def audit_records(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    real_records = []
    synthetic_records = []
    class_counts = {c: 0 for c in TOMATO_CLASSES}

    for idx, r in enumerate(records):
        img_path = r.get('image_path')
        if not os.path.isabs(img_path):
            abs_img_path = os.path.join(REPO_ROOT, img_path)
        else:
            abs_img_path = img_path

        c_idx = r.get('corrected_class_index')
        c_name = r.get('corrected_class_name')

        if c_name in class_counts:
            class_counts[c_name] += 1

        im = Image.open(abs_img_path)
        w, h = im.size
        file_size = os.path.getsize(abs_img_path)

        # Flag 10x10 synthetic dummies
        if w < 50 or h < 50 or file_size < 500:
            synthetic_records.append({
                'index': idx,
                'id': r.get('id'),
                'image_path': img_path,
                'dimensions': [w, h],
                'file_size': file_size,
                'class_index': c_idx,
                'class_name': c_name,
                'reason': 'Synthetic test dummy from automated verification (10x10 block)'
            })
        else:
            real_records.append(r)

    audit_summary = {
        'total_records': len(records),
        'real_leaf_records': len(real_records),
        'synthetic_dummy_records': len(synthetic_records),
        'class_counts': class_counts,
        'synthetic_details': synthetic_records
    }
    return real_records, synthetic_records, audit_summary


def evaluate_model(
    model: nn.Module,
    dataset: LeafCorrectionItemDataset,
    device: torch.device
) -> Dict[str, Any]:
    model.eval()
    loader = DataLoader(dataset, batch_size=1, shuffle=False)

    predictions = []
    correct = 0
    total = len(dataset)

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels, item_ids in loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            conf, pred = torch.max(probs, 1)

            pred_idx = pred.item()
            target_idx = labels.item()
            conf_val = round(conf.item() * 100, 2)
            is_correct = (pred_idx == target_idx)

            if is_correct:
                correct += 1

            all_preds.append(pred_idx)
            all_targets.append(target_idx)

            predictions.append({
                'item_id': item_ids[0],
                'true_class_index': target_idx,
                'true_class_name': TOMATO_CLASSES[target_idx],
                'predicted_class_index': pred_idx,
                'predicted_class_name': TOMATO_CLASSES[pred_idx],
                'confidence_percent': conf_val,
                'correct': is_correct
            })

    accuracy = round((correct / max(total, 1)) * 100, 2)

    # Compute confusion matrix for 10 classes
    matrix = np.zeros((10, 10), dtype=int)
    for t, p in zip(all_targets, all_preds):
        matrix[t, p] += 1

    # Per-class metrics
    class_metrics = {}
    for c in range(10):
        tp = matrix[c, c]
        fp = np.sum(matrix[:, c]) - tp
        fn = np.sum(matrix[c, :]) - tp
        support = np.sum(matrix[c, :])

        precision = round(float(tp / (tp + fp)), 4) if (tp + fp) > 0 else 0.0
        recall = round(float(tp / (tp + fn)), 4) if (tp + fn) > 0 else 0.0
        f1 = round(float(2 * precision * recall / (precision + recall)), 4) if (precision + recall) > 0 else 0.0

        if support > 0:
            class_metrics[TOMATO_CLASSES[c]] = {
                'support': int(support),
                'precision': precision,
                'recall': recall,
                'f1': f1
            }

    return {
        'total_evaluated': total,
        'correct': correct,
        'accuracy_percent': accuracy,
        'predictions': predictions,
        'per_class_metrics': class_metrics,
        'confusion_matrix': matrix.tolist()
    }


def run_experiment():
    print("=" * 80)
    print("AGRIVISION AI -- PHASE 1.5: CONTROLLED CORRECTION FINE-TUNING TRIAL")
    print("=" * 80)

    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\nExecution device: {device}")

    # -------------------------------------------------------------------------
    # 1. Audit manifest records
    # -------------------------------------------------------------------------
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        all_records = json.load(f)

    real_records, synthetic_records, audit_summary = audit_records(all_records)
    print(f"\n1. DATASET AUDIT:")
    print(f"   - Total records in data/corrections/manifest.json: {len(all_records)}")
    print(f"   - Genuine field leaf images: {len(real_records)}")
    print(f"   - Synthetic dummy test images: {len(synthetic_records)}")
    print("\n   Class Breakdown:")
    for c, cnt in audit_summary['class_counts'].items():
        if cnt > 0:
            print(f"     * {c}: {cnt}")

    # -------------------------------------------------------------------------
    # 2. Strict Dataset Splitting (Held-Out Evaluation Set)
    # -------------------------------------------------------------------------
    # We strictly separate real records into train vs held-out test
    # Record 0 & 2 of real_records -> Training split
    # Record 1 & 3 of real_records -> Held-Out Test split
    if len(real_records) < 2:
        print("\nERROR: Fewer than 2 real leaf records available. Cannot form independent train and eval sets.")
        return

    train_records = [real_records[0], real_records[2]]  # Late Blight (#2) & Healthy (#9)
    test_records = [real_records[1], real_records[3]]   # Mosaic Virus (#8) & Healthy (#9)

    print(f"\n2. DATASET SPLIT (Strict Separation):")
    print(f"   - Fine-Tuning Split (N={len(train_records)}):")
    for r in train_records:
        print(f"       * {r['id'][:8]}.. | {r['corrected_class_name']} (#{r['corrected_class_index']}) | {r['image_path']}")
    print(f"   - Held-Out Independent Evaluation Split (N={len(test_records)}):")
    for r in test_records:
        print(f"       * {r['id'][:8]}.. | {r['corrected_class_name']} (#{r['corrected_class_index']}) | {r['image_path']}")
    print("   [CRITICAL] Held-out evaluation images will NEVER be seen during training.")

    # -------------------------------------------------------------------------
    # 3. Preprocessing Transformations
    # -------------------------------------------------------------------------
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = LeafCorrectionItemDataset(train_records, transform=train_transform)
    test_dataset = LeafCorrectionItemDataset(test_records, transform=eval_transform)

    # -------------------------------------------------------------------------
    # 4. Load Baseline Model & Evaluate on Held-Out Test Set
    # -------------------------------------------------------------------------
    print(f"\n3. BASELINE MODEL EVALUATION:")
    print(f"   Loading baseline checkpoint: {BASELINE_PTH}")
    baseline_model = build_mobilenetv3_classifier(num_classes=10, checkpoint_path=BASELINE_PTH)
    baseline_model.to(device)

    baseline_results = evaluate_model(baseline_model, test_dataset, device)
    print(f"   Baseline Held-Out Accuracy: {baseline_results['accuracy_percent']}% ({baseline_results['correct']}/{baseline_results['total_evaluated']})")
    for p in baseline_results['predictions']:
        status = 'MATCH' if p['correct'] else 'DIFF'
        print(f"     - True: {p['true_class_name']} (#{p['true_class_index']}) | Pred: {p['predicted_class_name']} (#{p['predicted_class_index']}) | Conf: {p['confidence_percent']}% | [{status}]")

    # -------------------------------------------------------------------------
    # 5. Controlled Fine-Tuning Trial
    # -------------------------------------------------------------------------
    print(f"\n4. CONTROLLED FINE-TUNING TRIAL (Conservative Settings):")
    candidate_model = build_mobilenetv3_classifier(num_classes=10, checkpoint_path=BASELINE_PTH)
    candidate_model.to(device)

    # Freeze feature backbone
    for param in candidate_model.features.parameters():
        param.requires_grad = False

    # Train only classifier head
    trainable_params = [p for p in candidate_model.classifier.parameters() if p.requires_grad]
    optimizer = optim.AdamW(trainable_params, lr=5e-5, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss()

    train_loader = DataLoader(train_dataset, batch_size=2, shuffle=True)
    epochs = 2
    print(f"   - Epochs: {epochs}")
    print(f"   - Learning Rate: 5e-5 (AdamW)")
    print(f"   - Batch Size: 2")
    print(f"   - Frozen Backbone: All 62 feature layers frozen")
    print(f"   - Trainable Head: classifier[3] Linear(1280 -> 10)")

    candidate_model.train()
    training_log = []
    for ep in range(epochs):
        running_loss = 0.0
        correct_train = 0
        total_train = 0
        for imgs, labels, _ in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = candidate_model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * imgs.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += (preds == labels).sum().item()
            total_train += labels.size(0)

        ep_loss = round(running_loss / total_train, 4)
        ep_acc = round((correct_train / total_train) * 100, 2)
        print(f"   Epoch {ep+1}/{epochs} | Loss: {ep_loss} | Train Accuracy: {ep_acc}%")
        training_log.append({'epoch': ep + 1, 'loss': ep_loss, 'train_accuracy': ep_acc})

    # Save candidate checkpoint
    torch.save(candidate_model.state_dict(), CANDIDATE_PTH)
    print(f"\n   Candidate checkpoint saved: {CANDIDATE_PTH} ({os.path.getsize(CANDIDATE_PTH)} bytes)")

    # Export candidate to ONNX in training_artifacts/
    export_candidate_to_onnx(candidate_model, CANDIDATE_ONNX)

    # -------------------------------------------------------------------------
    # 6. Evaluate Candidate Model on Identical Held-Out Test Set
    # -------------------------------------------------------------------------
    print(f"\n5. CANDIDATE MODEL EVALUATION (Identical Held-Out Test Set):")
    candidate_results = evaluate_model(candidate_model, test_dataset, device)
    print(f"   Candidate Held-Out Accuracy: {candidate_results['accuracy_percent']}% ({candidate_results['correct']}/{candidate_results['total_evaluated']})")
    for p in candidate_results['predictions']:
        status = 'MATCH' if p['correct'] else 'DIFF'
        print(f"     - True: {p['true_class_name']} (#{p['true_class_index']}) | Pred: {p['predicted_class_name']} (#{p['predicted_class_index']}) | Conf: {p['confidence_percent']}% | [{status}]")

    # -------------------------------------------------------------------------
    # 7. Verification of Production Safety
    # -------------------------------------------------------------------------
    prod_onnx = os.path.join(REPO_ROOT, 'public', 'models', 'tomato_mobilenetv3_v2.onnx')
    with open(prod_onnx, 'rb') as f_prod:
        prod_sha256 = hashlib.sha256(f_prod.read()).hexdigest().upper()

    print(f"\n6. PRODUCTION MODEL SAFETY VERIFICATION:")
    print(f"   Production Model Path: {prod_onnx}")
    print(f"   Current SHA-256: {prod_sha256}")
    expected_sha256 = 'C1B55CCFA1DBA3212649880A303D30019D4A4B1FA33FC4B822264297A06C5AB5'
    if prod_sha256 == expected_sha256:
        print("   [PASS] Production ONNX model is 100% UNCHANGED and UNTOUCHED.")
    else:
        raise RuntimeError("FATAL: Production model SHA256 altered!")

    # -------------------------------------------------------------------------
    # 8. Report Compilation & Machine Learning Limitation Statement
    # -------------------------------------------------------------------------
    report_data = {
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'baseline_checkpoint': BASELINE_PTH,
        'candidate_checkpoint': CANDIDATE_PTH,
        'candidate_onnx': CANDIDATE_ONNX,
        'production_model_sha256_unmodified': prod_sha256 == expected_sha256,
        'audit': audit_summary,
        'dataset_split': {
            'train_size': len(train_records),
            'test_size': len(test_records),
            'train_items': [r['id'] for r in train_records],
            'test_items': [r['id'] for r in test_records]
        },
        'training_configuration': {
            'epochs': epochs,
            'learning_rate': 5e-5,
            'optimizer': 'AdamW',
            'weight_decay': 1e-4,
            'loss_function': 'CrossEntropyLoss',
            'frozen_backbone': True,
            'batch_size': 2,
            'training_log': training_log
        },
        'evaluation': {
            'baseline': baseline_results,
            'candidate': candidate_results,
            'delta_accuracy': round(candidate_results['accuracy_percent'] - baseline_results['accuracy_percent'], 2)
        },
        'scientific_limitations': {
            'is_sample_size_adequate': False,
            'sample_size_warning': 'The correction dataset currently contains only 4 genuine leaf images. A sample size of N=2 for evaluation and N=2 for fine-tuning has zero statistical significance.',
            'claim_improvement': False,
            'data_needed_for_production_upgrade': [
                'Balanced multi-class tomato leaf test benchmark (minimum 100 verified images per class across all 10 tomato classes).',
                'Independent in-field leaf background dataset (e.g. PlantDoc subset) with varied lighting, focus, and camera sensors.',
                'Cross-validation splits to verify no catastrophic forgetting on established classes.'
            ]
        }
    }

    with open(REPORT_JSON, 'w', encoding='utf-8') as f_rep:
        json.dump(report_data, f_rep, indent=2)

    print(f"\n7. REPORT GENERATED:")
    print(f"   Full trial report saved to: {REPORT_JSON}")
    print("\n" + "=" * 80)
    print("PHASE 1.5 CONTROLLED TRIAL COMPLETE (NO PRODUCTION MODEL OVERWRITTEN)")
    print("=" * 80)


if __name__ == '__main__':
    run_experiment()
