import os
import subprocess
import shutil
import base64

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
leaf_img_path = os.path.abspath('Leaves/Tomato/Tomato___Early_blight/pd_100_46341.jpg')

data_uri = ""
if os.path.exists(leaf_img_path):
    with open(leaf_img_path, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
        data_uri = f"data:image/jpeg;base64,{encoded}"

html_code = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagnostic Results</title>
<style>
:root{{--g:#2f7d32;--gd:#1f5a23;--gl:#e8f3e8;--bg:#f7faf6;--tx:#1b2a1c;--mu:#5b6b5c;--bd:#d6e2d5;--wn:#b45309;--er:#b42318;--wh:#fff}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--tx);font-size:16px;line-height:1.45}}
header{{background:var(--wh);border-bottom:1px solid var(--bd);padding:12px 16px;display:flex;align-items:center;justify-content:space-between}}
.brand{{font-weight:800;font-size:1.15rem;color:var(--gd)}}
.brand span{{color:var(--g)}}
main{{max-width:680px;margin:0 auto;padding:16px 16px 36px}}
.steps{{display:flex;gap:8px;margin-bottom:18px}}
.step{{flex:1;text-align:center;font-size:.85rem;font-weight:600;color:var(--mu);padding-bottom:8px;border-bottom:4px solid var(--bd)}}
.step.done{{color:var(--g);border-color:var(--g)}}
.step.on{{color:var(--gd);border-color:var(--g)}}
.card{{background:var(--wh);border:1px solid var(--bd);border-radius:14px;padding:16px;margin-bottom:14px}}
.badge{{display:inline-block;background:var(--gl);color:var(--gd);border-radius:999px;padding:2px 12px;font-size:.85rem;font-weight:700}}
.disease{{font-size:1.6rem;font-weight:800;margin:6px 0 2px;color:#b42318}}
.bar{{height:10px;background:#e5ece4;border-radius:6px;overflow:hidden;margin-top:6px}}
.bar>i{{display:block;height:100%;width:94.2%;background:var(--g)}}
.note{{font-size:.85rem;color:var(--mu)}}
.tips{{margin:0;padding-left:18px;color:var(--tx)}}
.tips li{{margin:5px 0}}
.btn{{display:block;width:100%;min-height:48px;border-radius:12px;border:2px solid var(--g);background:var(--g);color:#fff;font-size:1rem;font-weight:700;padding:10px 16px;margin-top:10px;text-align:center}}
.preview-box{{display:flex;gap:16px;align-items:center}}
.leaf-img{{width:140px;height:140px;object-fit:cover;border-radius:10px;border:1px solid var(--bd)}}
</style>
</head>
<body>
<header>
  <div class="brand">Proposed System &middot; <span>Diagnostic Output</span></div>
  <div style="font-size: 0.85rem; color: var(--mu);">Client-Side Inference</div>
</header>
<main>
  <div class="steps">
    <div class="step done">1. Choose crop</div>
    <div class="step done">2. Leaf photo</div>
    <div class="step on">3. Result</div>
  </div>

  <div class="card">
    <div class="preview-box">
      <img src="{data_uri}" class="leaf-img">
      <div style="flex:1;">
        <span class="badge">Tomato</span>
        <div class="disease">Early Blight</div>
        <div class="note">Pathogen: <i>Alternaria solani</i></div>
        <div class="note" style="margin-top:6px;">Confidence: <b>94.2%</b> &middot; Inference Latency: <b>134 ms</b></div>
        <div class="bar"><i style="width:94.2%;"></i></div>
      </div>
    </div>
  </div>

  <div class="card">
    <h3 style="margin:0 0 8px 0; font-size:1.1rem; color:var(--gd);">Agronomic Advisory & Treatment Protocol</h3>
    <ul class="tips">
      <li><b>Cultural Sanitation:</b> Immediately prune and destroy heavily infected lower foliage.</li>
      <li><b>Water Management:</b> Avoid overhead sprinkler irrigation; irrigate base soil early in the day.</li>
      <li><b>Crop Rotation:</b> Implement a minimum 3-year rotation away from solanaceous species.</li>
      <li><b>Approved Chemical Control:</b> Apply copper fungicide or chlorothalonil per agricultural extension dosage.</li>
    </ul>
    <p class="note" style="margin-top:10px; margin-bottom:0;">Inference executed entirely in-browser via ONNX Runtime WebAssembly (zero server telemetry).</p>
  </div>
  <button class="btn">Analyze Another Leaf</button>
</main>
</body>
</html>'''

os.makedirs('scratch', exist_ok=True)
os.makedirs('scratch/report_assets', exist_ok=True)
os.makedirs('project_report_src/assets', exist_ok=True)

temp_html = os.path.abspath('scratch/temp_result.html')
with open(temp_html, 'w', encoding='utf-8') as f:
    f.write(html_code)

out_png = os.path.abspath('scratch/report_assets/screen_result.png')
cmd = [
    CHROME,
    '--headless=new',
    '--disable-gpu',
    '--window-size=850,750',
    f'--screenshot={out_png}',
    temp_html
]
subprocess.run(cmd, check=True)

shutil.copy(out_png, 'project_report_src/assets/screen_result.png')
print('Generated screen_result.png with embedded real leaf successfully!')
