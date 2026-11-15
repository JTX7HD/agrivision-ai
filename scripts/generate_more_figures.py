"""
Generate additional detailed technical diagrams for Chapter 3 and Appendix B
matching the reference report's figures.
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

ASSETS_DIR = os.path.abspath('scratch/report_assets')

# Figure 3.4: User / Farmer Workflow
def generate_fig3_4():
    fig, ax = plt.subplots(figsize=(8.5, 1.8), dpi=200)
    ax.axis('off')
    
    steps = [
        ("Open Web App\n/ Select Crop", 0.04, 0.25, 0.16, 0.50),
        ("Capture or Upload\nLeaf Photo", 0.24, 0.25, 0.16, 0.50),
        ("Preprocess &\nQuality Check", 0.44, 0.25, 0.16, 0.50),
        ("ONNX Neural\nClassification", 0.64, 0.25, 0.16, 0.50),
        ("View Diagnosis\n& Advisory Tips", 0.84, 0.25, 0.14, 0.50)
    ]
    
    for text, x, y, w, h in steps:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03",
                                      facecolor='#e8f5e9', edgecolor='#2e7d32', linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=8, fontweight='semibold', color='#1b5e20')
        
    for i in range(len(steps)-1):
        x1 = steps[i][1] + steps[i][3]
        x2 = steps[i+1][1]
        ax.annotate('', xy=(x2, 0.50), xytext=(x1, 0.50), arrowprops=dict(arrowstyle="->", color="#37474f", lw=1.5, mutation_scale=10))
        
    plt.tight_layout()
    fig.savefig(os.path.join(ASSETS_DIR, "fig3_4_user_workflow.png"), bbox_inches='tight')
    plt.close()
    print("Generated fig3_4_user_workflow.png")

# Figure 3.7: ML Pipeline
def generate_fig3_7():
    fig, ax = plt.subplots(figsize=(8.5, 2.0), dpi=200)
    ax.axis('off')
    
    nodes = [
        ("Dataset\nCuration", 0.05, 0.25, 0.12, 0.50),
        ("Data Cleaning &\nAugmentation", 0.21, 0.25, 0.15, 0.50),
        ("Patient / Crop\nLevel Split", 0.40, 0.25, 0.14, 0.50),
        ("Model Training &\nFine-Tuning", 0.58, 0.25, 0.15, 0.50),
        ("ONNX Quantization\n& Optimization", 0.77, 0.25, 0.17, 0.50)
    ]
    for text, x, y, w, h in nodes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03",
                                      facecolor='#e3f2fd', edgecolor='#1565c0', linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=8, fontweight='semibold', color='#0d47a1')
        
    for i in range(len(nodes)-1):
        x1 = nodes[i][1] + nodes[i][3]
        x2 = nodes[i+1][1]
        ax.annotate('', xy=(x2, 0.50), xytext=(x1, 0.50), arrowprops=dict(arrowstyle="->", color="#37474f", lw=1.5, mutation_scale=10))
        
    plt.tight_layout()
    fig.savefig(os.path.join(ASSETS_DIR, "fig3_7_ml_pipeline.png"), bbox_inches='tight')
    plt.close()
    print("Generated fig3_7_ml_pipeline.png")

# Figure 3.9: Preprocessing Pipeline
def generate_fig3_9():
    fig, ax = plt.subplots(figsize=(8.5, 2.2), dpi=200)
    ax.axis('off')
    
    stages = [
        ("Raw Leaf Input\n(Variable Resolution)", 0.04, 0.25, 0.16, 0.50),
        ("RGB Conversion\n& Bilinear Resize\n(224 x 224)", 0.24, 0.25, 0.17, 0.50),
        ("Pixel Scaling\n[0.0, 1.0]", 0.45, 0.25, 0.14, 0.50),
        ("ImageNet Z-Score\nNorm (Mean/Std)", 0.63, 0.25, 0.16, 0.50),
        ("NCHW Tensor\n(1, 3, 224, 224)", 0.83, 0.25, 0.14, 0.50)
    ]
    for text, x, y, w, h in stages:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03",
                                      facecolor='#fff3e0', edgecolor='#e65100', linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=8, fontweight='semibold', color='#bf360c')
        
    for i in range(len(stages)-1):
        x1 = stages[i][1] + stages[i][3]
        x2 = stages[i+1][1]
        ax.annotate('', xy=(x2, 0.50), xytext=(x1, 0.50), arrowprops=dict(arrowstyle="->", color="#37474f", lw=1.5, mutation_scale=10))
        
    plt.tight_layout()
    fig.savefig(os.path.join(ASSETS_DIR, "fig3_9_preprocessing.png"), bbox_inches='tight')
    plt.close()
    print("Generated fig3_9_preprocessing.png")

# Figure 3.10: Quality Inspection and Uncertainty Gating Flow
def generate_fig3_10():
    fig, ax = plt.subplots(figsize=(8.5, 3.2), dpi=200)
    ax.axis('off')
    
    boxes = [
        ("Input Leaf Photo", 0.05, 0.60, 0.18, 0.25, '#f5f5f5', '#616161'),
        ("Luminance &\nContrast Check", 0.28, 0.60, 0.18, 0.25, '#e8f5e9', '#2e7d32'),
        ("Blur Analysis\n(Laplacian Variance)", 0.52, 0.60, 0.20, 0.25, '#e8f5e9', '#2e7d32'),
        ("Neural Classifier\nInference", 0.77, 0.60, 0.18, 0.25, '#e3f2fd', '#1565c0'),
        ("Reject / Retake Request\n(Low Light / Extreme Blur)", 0.40, 0.10, 0.26, 0.25, '#ffebee', '#c62828'),
        ("Confidence & Entropy Gating\n(Uncertain if Top-1 < 60%)", 0.72, 0.10, 0.24, 0.25, '#fff8e1', '#f57f17')
    ]
    for text, x, y, w, h, bg, border in boxes:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03", facecolor=bg, edgecolor=border, linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=8, fontweight='semibold', color='#212121')
        
    arrow_props = dict(arrowstyle="->", color="#37474f", lw=1.3, mutation_scale=10)
    ax.annotate('', xy=(0.28, 0.72), xytext=(0.23, 0.72), arrowprops=arrow_props)
    ax.annotate('', xy=(0.52, 0.72), xytext=(0.46, 0.72), arrowprops=arrow_props)
    ax.annotate('', xy=(0.77, 0.72), xytext=(0.72, 0.72), arrowprops=arrow_props)
    
    # Rejection arrows
    ax.annotate('Fail', xy=(0.45, 0.35), xytext=(0.37, 0.60), arrowprops=dict(arrowstyle="->", color="#c62828", lw=1.3))
    ax.annotate('Fail', xy=(0.55, 0.35), xytext=(0.60, 0.60), arrowprops=dict(arrowstyle="->", color="#c62828", lw=1.3))
    ax.annotate('Post-Eval', xy=(0.84, 0.35), xytext=(0.84, 0.60), arrowprops=dict(arrowstyle="->", color="#f57f17", lw=1.3))
    
    plt.tight_layout()
    fig.savefig(os.path.join(ASSETS_DIR, "fig3_10_quality_flow.png"), bbox_inches='tight')
    plt.close()
    print("Generated fig3_10_quality_flow.png")

# Figure 3.12: MobileNetV3 Inverted Residual Block Architecture
def generate_fig3_12():
    fig, ax = plt.subplots(figsize=(8.5, 2.6), dpi=200)
    ax.axis('off')
    
    blocks = [
        ("Input Tensor\n(H x W x C_in)", 0.04, 0.30, 0.14, 0.40, '#f5f5f5', '#757575'),
        ("1x1 Conv (Expand)\n+ Hard-Swish", 0.22, 0.30, 0.16, 0.40, '#e8f5e9', '#2e7d32'),
        ("3x3 / 5x5 Dwise Conv\n(Depthwise Stride 1/2)", 0.42, 0.30, 0.18, 0.40, '#e3f2fd', '#1565c0'),
        ("Squeeze & Excite (SE)\n(Channel Attention)", 0.64, 0.30, 0.16, 0.40, '#fff3e0', '#e65100'),
        ("1x1 Conv (Linear)\n+ Residual Add", 0.84, 0.30, 0.14, 0.40, '#ede7f6', '#512da8')
    ]
    for text, x, y, w, h, bg, border in blocks:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03", facecolor=bg, edgecolor=border, linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=8, fontweight='semibold', color='#212121')
        
    for i in range(len(blocks)-1):
        x1 = blocks[i][1] + blocks[i][3]
        x2 = blocks[i+1][1]
        ax.annotate('', xy=(x2, 0.50), xytext=(x1, 0.50), arrowprops=dict(arrowstyle="->", color="#37474f", lw=1.5, mutation_scale=10))
        
    # Residual skip connection
    ax.annotate('Residual Skip Connection (when stride=1 and C_in == C_out)', xy=(0.91, 0.70), xytext=(0.11, 0.70),
                arrowprops=dict(arrowstyle="->", color="#2e7d32", lw=1.5, connectionstyle="arc3,rad=-0.25"),
                fontsize=7.5, color="#1b5e20", fontweight='bold', ha='center')
    
    plt.tight_layout()
    fig.savefig(os.path.join(ASSETS_DIR, "fig3_12_mobilenet_block.png"), bbox_inches='tight')
    plt.close()
    print("Generated fig3_12_mobilenet_block.png")

# Figure 3.14: Database / ER Diagram
def generate_fig3_14():
    fig, ax = plt.subplots(figsize=(8.5, 3.4), dpi=200)
    ax.axis('off')
    
    entities = [
        ("User / Profile\n• user_id (PK)\n• role, email, name\n• created_at", 0.05, 0.55, 0.18, 0.36, '#e8eaf6', '#283593'),
        ("Scan Record\n• scan_id (PK)\n• user_id (FK), crop_id\n• image_hash, timestamp", 0.28, 0.55, 0.20, 0.36, '#e8f5e9', '#2e7d32'),
        ("Prediction Output\n• pred_id (PK)\n• scan_id (FK), class_idx\n• confidence, uncertainty", 0.53, 0.55, 0.20, 0.36, '#fff8e1', '#f57f17'),
        ("Advisory Guide\n• guide_id (PK)\n• disease_label\n• symptoms, treatment", 0.77, 0.55, 0.18, 0.36, '#fbe9e7', '#d84315'),
        ("Audit & Activity Log\n• log_id (PK)\n• user_id (FK), action_type\n• ip_address, timestamp", 0.28, 0.05, 0.20, 0.36, '#f3e5f5', '#7b1fa2'),
        ("Correction Record\n• corr_id (PK)\n• scan_id (FK), expert_label\n• model_checkpoint, status", 0.53, 0.05, 0.20, 0.36, '#e0f2f1', '#00695c')
    ]
    for text, x, y, w, h, bg, border in entities:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03", facecolor=bg, edgecolor=border, linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=7.5, color='#212121')
        
    ax.annotate('', xy=(0.28, 0.73), xytext=(0.23, 0.73), arrowprops=dict(arrowstyle="<->", color="#37474f", lw=1.3))
    ax.annotate('', xy=(0.53, 0.73), xytext=(0.48, 0.73), arrowprops=dict(arrowstyle="<->", color="#37474f", lw=1.3))
    ax.annotate('', xy=(0.77, 0.73), xytext=(0.73, 0.73), arrowprops=dict(arrowstyle="<->", color="#37474f", lw=1.3))
    ax.annotate('', xy=(0.38, 0.41), xytext=(0.38, 0.55), arrowprops=dict(arrowstyle="<->", color="#37474f", lw=1.3))
    ax.annotate('', xy=(0.63, 0.41), xytext=(0.63, 0.55), arrowprops=dict(arrowstyle="<->", color="#37474f", lw=1.3))
    
    plt.tight_layout()
    fig.savefig(os.path.join(ASSETS_DIR, "fig3_14_database_er.png"), bbox_inches='tight')
    plt.close()
    print("Generated fig3_14_database_er.png")

# Figure 3.15: Complete System Data Flow and Synchronization Workflow
def generate_fig3_15():
    fig, ax = plt.subplots(figsize=(8.5, 2.8), dpi=200)
    ax.axis('off')
    
    steps = [
        ("Farmer Client UI\n(Mobile / Desktop)", 0.05, 0.40, 0.18, 0.35, '#e8f5e9', '#2e7d32'),
        ("Edge Quality\nInspection", 0.28, 0.40, 0.18, 0.35, '#e0f2f1', '#00796b'),
        ("Crop Isolated\nONNX Inference", 0.51, 0.40, 0.18, 0.35, '#e3f2fd', '#1565c0'),
        ("Local / Cloud\nPersistence Sync", 0.74, 0.40, 0.18, 0.35, '#fff3e0', '#e65100')
    ]
    for text, x, y, w, h, bg, border in steps:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03", facecolor=bg, edgecolor=border, linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=8.5, fontweight='semibold', color='#212121')
        
    ax.annotate('', xy=(0.28, 0.57), xytext=(0.23, 0.57), arrowprops=dict(arrowstyle="->", color="#37474f", lw=1.4))
    ax.annotate('', xy=(0.51, 0.57), xytext=(0.46, 0.57), arrowprops=dict(arrowstyle="->", color="#37474f", lw=1.4))
    ax.annotate('', xy=(0.74, 0.57), xytext=(0.69, 0.57), arrowprops=dict(arrowstyle="->", color="#37474f", lw=1.4))
    
    # Return loop
    ax.annotate('Advisory Guidance & Confidence Delivered to Farmer Interface', xy=(0.14, 0.40), xytext=(0.60, 0.18),
                arrowprops=dict(arrowstyle="->", color="#2e7d32", lw=1.4, connectionstyle="arc3,rad=-0.15"),
                fontsize=8, color="#1b5e20", fontweight='bold', ha='center')
    
    plt.tight_layout()
    fig.savefig(os.path.join(ASSETS_DIR, "fig3_15_system_workflow.png"), bbox_inches='tight')
    plt.close()
    print("Generated fig3_15_system_workflow.png")

if __name__ == '__main__':
    generate_fig3_4()
    generate_fig3_7()
    generate_fig3_9()
    generate_fig3_10()
    generate_fig3_12()
    generate_fig3_14()
    generate_fig3_15()
    print("All additional figures generated successfully!")
