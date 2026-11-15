import pymupdf
import os

pdf_path = os.path.abspath('AI_Powered_Multi_Crop_Leaf_Disease_Classification_Project_Report.pdf')
doc = pymupdf.open(pdf_path)

print(f"Total pages: {len(doc)}")
assert len(doc) == 56, f"Expected 56 pages, found {len(doc)}"

for i, page in enumerate(doc):
    text = page.get_text()
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    first_few = " | ".join(lines[:3]) if lines else "EMPTY PAGE!"
    last_few = " | ".join(lines[-2:]) if len(lines) >= 2 else ""
    print(f"Page {i+1:02d}: length={len(text):4d} chars | Top: {first_few[:70]} | Bottom: {last_few[:50]}")

print("\n--- Checking for empty or corrupt pages ---")
empty_pages = [i+1 for i, page in enumerate(doc) if len(page.get_text().strip()) == 0]
if empty_pages:
    print(f"WARNING: Empty pages found: {empty_pages}")
else:
    print("All 56 pages contain valid text content!")
