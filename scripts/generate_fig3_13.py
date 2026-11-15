import os
import shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('scratch/report_assets', exist_ok=True)
os.makedirs('project_report_src/assets', exist_ok=True)

fig, ax = plt.subplots(figsize=(9, 4), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 4.5)
ax.axis('off')

# Client Browser Box
ax.add_patch(patches.FancyBboxPatch((0.5, 1.2), 2.4, 2.2, boxstyle="round,pad=0.1", fc="#e8f5e9", ec="#2e7d32", lw=2))
ax.text(1.7, 3.0, "Client Browser (PWA)", ha='center', va='center', fontsize=11, fontweight='bold', color="#1b5e20")
ax.text(1.7, 2.4, "React 19 / Next.js\nHTML5 Web Worker\nONNX Runtime WASM\nIndexedDB Cache", ha='center', va='center', fontsize=8.5, color="#2e7d32")

# Arrows
ax.annotate('', xy=(3.8, 2.6), xytext=(3.0, 2.6), arrowprops=dict(arrowstyle="->", lw=1.8, color="#374151"))
ax.annotate('', xy=(3.0, 2.0), xytext=(3.8, 2.0), arrowprops=dict(arrowstyle="->", lw=1.8, color="#374151"))
ax.text(3.4, 2.8, "HTTPS / JSON", ha='center', va='center', fontsize=7.5, color="#4b5563")
ax.text(3.4, 1.7, "Advisory Payload", ha='center', va='center', fontsize=7.5, color="#4b5563")

# REST API Gateway Box
ax.add_patch(patches.FancyBboxPatch((3.9, 1.2), 2.5, 2.2, boxstyle="round,pad=0.1", fc="#e3f2fd", ec="#1565c0", lw=2))
ax.text(5.15, 3.0, "API Gateway / Backend", ha='center', va='center', fontsize=11, fontweight='bold', color="#0d47a1")
ax.text(5.15, 2.4, "FastAPI / Flask Microservices\nJWT Authentication\nInput Validation Layer\nRate Limiter & CORS", ha='center', va='center', fontsize=8.5, color="#1565c0")

# Arrows
ax.annotate('', xy=(7.2, 2.3), xytext=(6.5, 2.3), arrowprops=dict(arrowstyle="<->", lw=1.8, color="#374151"))
ax.text(6.85, 2.6, "CRUD / Sync", ha='center', va='center', fontsize=7.5, color="#4b5563")

# Cloud Services & Database Box
ax.add_patch(patches.FancyBboxPatch((7.3, 1.2), 2.3, 2.2, boxstyle="round,pad=0.1", fc="#fff3e0", ec="#e65100", lw=2))
ax.text(8.45, 3.0, "Cloud & Storage", ha='center', va='center', fontsize=11, fontweight='bold', color="#bf360c")
ax.text(8.45, 2.4, "Cloud Firestore DB\nModel CDN Storage\nAudit Trail Logging\nAgronomic Knowledge", ha='center', va='center', fontsize=8.5, color="#e65100")

# Security Badge
ax.add_patch(patches.Rectangle((0.5, 0.3), 9.1, 0.6, fc="#f3f4f6", ec="#9ca3af", lw=1, ls="--"))
ax.text(5.05, 0.6, "Client-Side Zero-Telemetry Architecture: Raw leaf photographs never transmitted to servers", ha='center', va='center', fontsize=8.5, fontstyle='italic', color="#374151")

plt.tight_layout()
out_path = 'scratch/report_assets/fig3_13_backend.png'
plt.savefig(out_path, dpi=200, bbox_inches='tight')
plt.close()

shutil.copy(out_path, 'project_report_src/assets/fig3_13_backend.png')
print("Generated fig3_13_backend.png successfully!")
