"""
AgriVision AI - Lightweight Single Image Prediction CLI for /predict
Takes image file path / base64 and crop name ('Tomato', 'Potato', 'Chilli'),
loads the dedicated ONNX model, and returns JSON {label, confidence, uncertain}.
"""

import sys
import os
import json
import argparse
import numpy as np
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODELS = {
    'tomato': os.path.join(REPO_ROOT, 'public', 'models', 'tomato_mobilenetv3_v2.onnx'),
    'potato': os.path.join(REPO_ROOT, 'public', 'models', 'potato_disease.onnx'),
    'chilli': os.path.join(REPO_ROOT, 'public', 'models', 'chilli_disease.onnx')
}

CLASSES = {
    'tomato': [
        "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
        "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
        "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
        "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
        "Tomato___healthy"
    ],
    'potato': [
        "Potato__Early_Blight", "Potato__Healthy_Leaf", "Potato__Late_Blight"
    ],
    'chilli': [
        "Chili__Bacterial_Spot", "Chili__Cercospora_Leaf_Spot", "Chili__Curl_Virus",
        "Chili__Healthy_Leaf", "Chili__Nutrition_Deficiency", "Others",
        "Chili__Powdery_Mildew", "Chili__White_Spot"
    ]
}

def predict(image_path: str, crop: str):
    crop_lower = crop.lower()
    if crop_lower not in MODELS:
        raise ValueError(f"Unsupported crop: {crop}. Supported crops: tomato, potato, chilli.")

    model_path = MODELS[crop_lower]
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")

    import onnxruntime as ort
    session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])

    # Load and preprocess image (224x224 RGB, standard ImageNet normalization)
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224), Image.Resampling.BILINEAR)
    arr = np.array(img).astype(np.float32) / 255.0
    
    # ImageNet mean and std
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std
    arr = np.transpose(arr, (2, 0, 1))  # (3, 224, 224)
    arr = np.expand_dims(arr, axis=0)   # (1, 3, 224, 224)

    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: arr})
    logits = outputs[0][0]

    # Softmax
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)

    pred_idx = int(np.argmax(probs))
    conf = float(probs[pred_idx]) * 100.0

    class_list = CLASSES[crop_lower]
    label = class_list[pred_idx] if pred_idx < len(class_list) else f"Class_{pred_idx}"

    uncertain = conf < 60.0

    return {
        "label": label,
        "confidence": round(conf, 2),
        "uncertain": uncertain,
        "crop": crop
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Path to leaf image')
    parser.add_argument('--crop', default='tomato', help='Crop species (tomato, potato, chilli)')
    args = parser.parse_args()

    try:
        res = predict(args.image, args.crop)
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
