import os
import subprocess
import shutil

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

# Generate screen_advisory.png
advisory_html = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Comprehensive Agronomic Advisory</title>
<style>
:root{--g:#2f7d32;--gd:#1f5a23;--gl:#e8f3e8;--bg:#f7faf6;--tx:#1b2a1c;--mu:#5b6b5c;--bd:#d6e2d5;--wn:#b45309;--er:#b42318;--wh:#fff}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--tx);font-size:15px;line-height:1.45}
header{background:var(--wh);border-bottom:1px solid var(--bd);padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.brand{font-weight:800;font-size:1.15rem;color:var(--gd)}
main{max-width:680px;margin:0 auto;padding:16px 16px 30px}
.card{background:var(--wh);border:1px solid var(--bd);border-radius:14px;padding:16px;margin-bottom:14px}
.tab-row{display:flex;gap:8px;border-bottom:2px solid var(--bd);padding-bottom:6px;margin-bottom:12px}
.tab{font-weight:700;font-size:0.95rem;color:var(--mu);cursor:pointer;padding:4px 12px;border-radius:6px}
.tab.active{color:var(--gd);background:var(--gl)}
.protocol-item{margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed var(--bd)}
.protocol-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.protocol-title{font-weight:700;color:var(--gd);margin-bottom:4px}
.note{font-size:.85rem;color:var(--mu)}
</style>
</head>
<body>
<header>
  <div class="brand">Integrated Pest & Disease Management Advisory</div>
  <div style="font-size:0.85rem;color:var(--gd);font-weight:600;">Crop: Chilli Pepper (<i>Capsicum annuum</i>)</div>
</header>
<main>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <h3 style="margin:0;color:var(--gd);font-size:1.15rem;">Diagnosis: Anthracnose / White Spot (<i>Colletotrichum capsici</i>)</h3>
      <span style="background:#fee2e2;color:#991b1b;padding:2px 10px;border-radius:999px;font-size:0.8rem;font-weight:700;">Severe Threat</span>
    </div>
    
    <div class="tab-row">
      <div class="tab active">Cultural Control</div>
      <div class="tab">Biological / Organic</div>
      <div class="tab">Approved Chemical</div>
      <div class="tab">Preventive Sanitation</div>
    </div>

    <div class="protocol-item">
      <div class="protocol-title">1. Immediate Foliar & Fruit Sanitation</div>
      <div style="color:var(--tx);font-size:0.9rem;">Prune infected twigs and immediately collect fallen necrotic pods. Remove from field and burn or bury under 30 cm soil to interrupt conidial sporulation cycles.</div>
    </div>

    <div class="protocol-item">
      <div class="protocol-title">2. Canopy Aeration & Microclimate Adjustment</div>
      <div style="color:var(--tx);font-size:0.9rem;">Increase row spacing and prune lower vegetative suckers to reduce relative humidity beneath the crop canopy below the critical 80% spore germination threshold.</div>
    </div>

    <div class="protocol-item">
      <div class="protocol-title">3. Organic & Copper Prophylaxis</div>
      <div style="color:var(--tx);font-size:0.9rem;">Foliar application of Copper Oxychloride (COC 50% WP @ 2.5 g/L) or Bordeaux mixture (1%) at first sign of circular sunken foliar lesions. Repeat at 12-day intervals during wet weather.</div>
    </div>

    <div class="protocol-item">
      <div class="protocol-title">4. Seed Bed Sanitation for Succeeding Cycles</div>
      <div style="color:var(--tx);font-size:0.9rem;">Treat future seed stocks with <i>Trichoderma viride</i> (@ 4 g/kg seed) or Thiram (@ 2 g/kg). Strictly observe 2-year non-host rotation avoiding Solanaceae family members.</div>
    </div>
  </div>

  <div class="card" style="background:#f0fdf4;border-color:#bbf7d0;">
    <div style="font-weight:700;color:var(--gd);margin-bottom:4px;font-size:0.95rem;">Regional Extension Service Notice</div>
    <div style="font-size:0.88rem;color:#166534;">Recommendations conform to the package of practices issued by Kerala Agricultural University (KAU) and ICAR Horticultural Guidelines. Consult your local Krishi Bhavan officer before high-volume chemical spraying.</div>
  </div>
</main>
</body>
</html>'''

temp_adv = os.path.abspath('scratch/temp_advisory.html')
with open(temp_adv, 'w', encoding='utf-8') as f:
    f.write(advisory_html)

out_png = os.path.abspath('scratch/report_assets/screen_advisory.png')
cmd = [
    CHROME,
    '--headless=new',
    '--disable-gpu',
    '--window-size=850,750',
    f'--screenshot={out_png}',
    temp_adv
]
subprocess.run(cmd, check=True)
shutil.copy(out_png, 'project_report_src/assets/screen_advisory.png')
print('Generated screen_advisory.png successfully!')
