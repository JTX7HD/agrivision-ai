import os
import shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

dest_dirs = ['scratch/report_assets', 'project_report_src/assets']
for d in dest_dirs:
    os.makedirs(d, exist_ok=True)

def save_and_copy(fig, filename):
    p1 = os.path.join('scratch/report_assets', filename)
    plt.tight_layout()
    plt.savefig(p1, dpi=200, bbox_inches='tight')
    plt.close()
    p2 = os.path.join('project_report_src/assets', filename)
    shutil.copy(p1, p2)
    print(f"Saved {filename}")

# 1. Fig 3.2: Three-Tier Implementation Architecture
fig, ax = plt.subplots(figsize=(9, 4.2), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')

# Tier 1
ax.add_patch(patches.FancyBboxPatch((0.5, 4.2), 9, 1.4, boxstyle="round,pad=0.08", fc="#e8f5e9", ec="#2e7d32", lw=2))
ax.text(5, 5.25, "PRESENTATION LAYER (Next.js 16 / React 19 / TypeScript)", ha='center', va='center', fontsize=11, fontweight='bold', color="#1b5e20")
ax.text(5, 4.65, "Farmer PWA Interface  ·  Camera Video Stream Guide  ·  Diagnostic Result Panel  ·  Offline Advisory Cards", ha='center', va='center', fontsize=8.5, color="#2e7d32")

# Arrow 1 <-> 2
ax.annotate('', xy=(5, 3.8), xytext=(5, 4.2), arrowprops=dict(arrowstyle="<->", lw=2, color="#374151"))

# Tier 2
ax.add_patch(patches.FancyBboxPatch((0.5, 2.2), 9, 1.6, boxstyle="round,pad=0.08", fc="#e3f2fd", ec="#1565c0", lw=2))
ax.text(5, 3.45, "APPLICATION LAYER: Web Worker & Orchestration", ha='center', va='center', fontsize=11, fontweight='bold', color="#0d47a1")
ax.text(5, 2.9, "Bilinear Resize Engine (224x224)  ·  Laplacian Blur Check (Var > 100)  ·  Luminance Filter (40-220)\nModel Dispatcher  ·  Softmax Margin Uncertainty Evaluator (< 60% Warning)  ·  IndexedDB Cache", ha='center', va='center', fontsize=8.2, color="#1565c0", multialignment='center')

# Arrow 2 <-> 3
ax.annotate('', xy=(5, 1.8), xytext=(5, 2.2), arrowprops=dict(arrowstyle="<->", lw=2, color="#374151"))

# Tier 3
ax.add_patch(patches.FancyBboxPatch((0.5, 0.3), 9, 1.5, boxstyle="round,pad=0.08", fc="#f3e5f5", ec="#7b1fa2", lw=2))
ax.text(5, 1.45, "INTELLIGENCE LAYER: Edge-Native ONNX Neural Models", ha='center', va='center', fontsize=11, fontweight='bold', color="#4a148c")

# Sub-boxes in Tier 3
ax.add_patch(patches.FancyBboxPatch((0.8, 0.45), 2.6, 0.7, boxstyle="round,pad=0.05", fc="#ede7f6", ec="#7b1fa2", lw=1))
ax.text(2.1, 0.8, "Tomato MobileNetV3\n(10 classes · 17.1 MB)", ha='center', va='center', fontsize=7.5, color="#4a148c")

ax.add_patch(patches.FancyBboxPatch((3.7, 0.45), 2.6, 0.7, boxstyle="round,pad=0.05", fc="#ede7f6", ec="#7b1fa2", lw=1))
ax.text(5.0, 0.8, "Potato Disease CNN\n(3 classes · 21.8 MB)", ha='center', va='center', fontsize=7.5, color="#4a148c")

ax.add_patch(patches.FancyBboxPatch((6.6, 0.45), 2.6, 0.7, boxstyle="round,pad=0.05", fc="#ede7f6", ec="#7b1fa2", lw=1))
ax.text(7.9, 0.8, "Chilli Classifier\n(8 classes · 6.2 MB)", ha='center', va='center', fontsize=7.5, color="#4a148c")

save_and_copy(fig, 'fig3_2_architecture.png')


# 2. Fig 3.5: Agronomist Workflow
fig, ax = plt.subplots(figsize=(8.5, 2.0), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 2)
ax.axis('off')

boxes = [
    ("Login &\nVerification", 1.2),
    ("Review Flagged\nField Reports", 3.7),
    ("Validate Leaf\nPathology", 6.2),
    ("Broadcast Regional\nAdvisory Alert", 8.7)
]
for text, x in boxes:
    ax.add_patch(patches.FancyBboxPatch((x-1.0, 0.3), 2.0, 1.4, boxstyle="round,pad=0.08", fc="#e8f5e9", ec="#2e7d32", lw=1.5))
    ax.text(x, 1.0, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color="#1b5e20", multialignment='center')

for i in range(len(boxes)-1):
    x1 = boxes[i][1] + 1.05
    x2 = boxes[i+1][1] - 1.05
    ax.annotate('', xy=(x2, 1.0), xytext=(x1, 1.0), arrowprops=dict(arrowstyle="->", lw=1.8, color="#374151"))

save_and_copy(fig, 'fig3_5_agronomist_workflow.png')


# 3. Fig 3.6: Admin Workflow
fig, ax = plt.subplots(figsize=(8.5, 2.0), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 2)
ax.axis('off')

admin_boxes = [
    ("Admin Auth\n(JWT Guard)", 1.2),
    ("Manage Model\nRegistry & Weights", 3.7),
    ("Audit Logs &\nTelemetry Stats", 6.2),
    ("System Health &\nConfig Backup", 8.7)
]
for text, x in admin_boxes:
    ax.add_patch(patches.FancyBboxPatch((x-1.0, 0.3), 2.0, 1.4, boxstyle="round,pad=0.08", fc="#e3f2fd", ec="#1565c0", lw=1.5))
    ax.text(x, 1.0, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color="#0d47a1", multialignment='center')

for i in range(len(admin_boxes)-1):
    x1 = admin_boxes[i][1] + 1.05
    x2 = admin_boxes[i+1][1] - 1.05
    ax.annotate('', xy=(x2, 1.0), xytext=(x1, 1.0), arrowprops=dict(arrowstyle="->", lw=1.8, color="#374151"))

save_and_copy(fig, 'fig3_6_admin_workflow.png')


# 4. Fig 3.8: Foliar Disease Classification Inference Pipeline
fig, ax = plt.subplots(figsize=(9, 2.2), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 2.2)
ax.axis('off')

inf_steps = [
    ("Leaf Photo\nInput", 1.0),
    ("Aspect-Aware\nResize & Norm", 3.0),
    ("ONNX Model\nWASM Inference", 5.0),
    ("Confidence &\nMargin Gate", 7.0),
    ("Advisory Action\nProtocol", 9.0)
]
for text, x in inf_steps:
    ax.add_patch(patches.FancyBboxPatch((x-0.85, 0.3), 1.7, 1.6, boxstyle="round,pad=0.08", fc="#fff3e0", ec="#e65100", lw=1.5))
    ax.text(x, 1.1, text, ha='center', va='center', fontsize=8, fontweight='bold', color="#bf360c", multialignment='center')

for i in range(len(inf_steps)-1):
    x1 = inf_steps[i][1] + 0.9
    x2 = inf_steps[i+1][1] - 0.9
    ax.annotate('', xy=(x2, 1.1), xytext=(x1, 1.1), arrowprops=dict(arrowstyle="->", lw=1.8, color="#374151"))

save_and_copy(fig, 'fig3_8_inference.png')


# 5. Fig 3.11: Multi-crop foliar feature extraction and inference pipeline
fig, ax = plt.subplots(figsize=(9, 2.2), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 2.2)
ax.axis('off')

feat_steps = [
    ("224x224x3\nRGB Tensor", 1.0),
    ("Low-Level Edges\n& Color Textures", 3.0),
    ("Mid-Level Lesion\n& Margin Patterns", 5.0),
    ("High-Level Deep\nSemantic Vectors", 7.0),
    ("Softmax Class\nDistribution", 9.0)
]
for text, x in feat_steps:
    ax.add_patch(patches.FancyBboxPatch((x-0.85, 0.3), 1.7, 1.6, boxstyle="round,pad=0.08", fc="#e8eaf6", ec="#283593", lw=1.5))
    ax.text(x, 1.1, text, ha='center', va='center', fontsize=8, fontweight='bold', color="#1a237e", multialignment='center')

for i in range(len(feat_steps)-1):
    x1 = feat_steps[i][1] + 0.9
    x2 = feat_steps[i+1][1] - 0.9
    ax.annotate('', xy=(x2, 1.1), xytext=(x1, 1.1), arrowprops=dict(arrowstyle="->", lw=1.8, color="#374151"))

save_and_copy(fig, 'fig3_11_feature_pipeline.png')

print("All missing Chapter 3 figures generated successfully!")
