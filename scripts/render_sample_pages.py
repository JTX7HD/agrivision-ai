import pymupdf
import os

pdf_path = os.path.abspath('AI_Powered_Multi_Crop_Leaf_Disease_Classification_Project_Report.pdf')
out_dir = os.path.abspath('scratch/sample_pages')
os.makedirs(out_dir, exist_ok=True)

doc = pymupdf.open(pdf_path)

pages_to_render = [1, 3, 6, 13, 24, 27, 36, 42, 43, 52, 53, 54, 55, 56]
for p_num in pages_to_render:
    page = doc[p_num - 1]
    pix = page.get_pixmap(dpi=150)
    out_file = os.path.join(out_dir, f'page_{p_num:02d}.png')
    pix.save(out_file)
    print(f"Rendered page {p_num} -> {out_file}")

print("All sample pages rendered successfully.")
