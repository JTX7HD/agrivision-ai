import json
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.train_mobilenetv3_corrections import TomatoCorrectionsDataset, TOMATO_CLASSES

def test_dataset_loader():
    print("=== TESTING DATASET LOADER ON LOCAL PERSISTENT MANIFEST ===\n")
    manifest_path = 'data/corrections/manifest.json'
    assert os.path.exists(manifest_path), f"Manifest {manifest_path} not found"

    with open(manifest_path, 'r', encoding='utf-8') as f:
        samples = json.load(f)

    print(f"Total samples found in {manifest_path}: {len(samples)}")
    dataset = TomatoCorrectionsDataset(samples)

    for i in range(len(dataset)):
        im, lbl = dataset[i]
        assert im is not None, f"Image for sample {i} is None"
        assert 0 <= lbl <= 9, f"Label index {lbl} out of bounds"
        fmt = getattr(im, 'format', None) or 'RGB'
        print(f"  [OK] Sample #{i:02d}: label={lbl} ({TOMATO_CLASSES[lbl]}), size={im.size}, mode={im.mode}")

    print("\n[PASS] SUCCESS: TomatoCorrectionsDataset successfully loaded and verified all saved images and corrected labels.")

if __name__ == '__main__':
    test_dataset_loader()
