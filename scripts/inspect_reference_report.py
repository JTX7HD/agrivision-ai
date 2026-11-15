import pymupdf
import json

pdf_path = r'C:\Users\joel tom\.gemini\antigravity-ide\brain\69c5a756-01a0-48c3-8ad5-2e68cf3c4243\.user_uploaded\media_1792858783097.pdf'
doc = pymupdf.open(pdf_path)

print(f"Total pages: {len(doc)}")
pages_summary = []

for idx, page in enumerate(doc):
    text = page.get_text("text").strip()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    first_header = lines[0] if lines else "EMPTY"
    second_line = lines[1] if len(lines) > 1 else ""
    pages_summary.append({
        "page": idx + 1,
        "width": page.rect.width,
        "height": page.rect.height,
        "header": first_header,
        "sub": second_line[:60]
    })
    print(f"Page {idx+1:02d}: {first_header[:60]}  -->  {second_line[:50]}")

with open("scratch/reference_pages.json", "w", encoding="utf-8") as f:
    json.dump(pages_summary, f, indent=2)
