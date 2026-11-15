import json
import base64
import os
import io
from PIL import Image

manifest_path = 'data/corrections/manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    items = json.load(f)

cleaned = []
for idx, item in enumerate(items):
    image_path = item.get('image_path')
    # If file exists and PIL can open it
    if image_path and os.path.exists(image_path):
        try:
            im = Image.open(image_path)
            im.verify()
            cleaned.append(item)
            print(f"Keep existing valid image {image_path}")
            continue
        except Exception:
            print(f"Existing file invalid: {image_path}")

    # Try decode image_url
    url = item.get('image_url', '')
    if url:
        b64 = url.split(',', 1)[1] if ',' in url else url
        try:
            data = base64.b64decode(b64)
            im = Image.open(io.BytesIO(data))
            ext = 'jpg'
            if im.format:
                ext = im.format.lower()
                if ext == 'jpeg':
                    ext = 'jpg'
            fname = f"tomato_{item.get('corrected_class_name', 'sample')}_{item.get('id')[:8]}.{ext}"
            disk_path = os.path.join('data', 'corrections', 'images', fname)
            with open(disk_path, 'wb') as f_out:
                f_out.write(data)
            item['image_path'] = disk_path.replace('\\', '/')
            cleaned.append(item)
            print(f"Saved decoded image to {disk_path} ({im.size})")
        except Exception as e:
            print(f"Skipped corrupted item {item.get('id')}: {e}")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(cleaned, f, indent=2)

print(f"Cleaned manifest now has {len(cleaned)} validated entries.")
