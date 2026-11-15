"""
Master Python Script to generate the complete 56-page B.Tech Academic Project Report
and compile it to a downloadable PDF.
Title: AI-Powered Multi-Crop Leaf Disease Classification and Farmer Advisory System
Author: Joel Thomas Jacob (AJC23CS119)
Institution: Amal Jyothi College of Engineering (Autonomous), Kanjirappally
University: APJ Abdul Kalam Technological University, Kerala
"""

import os
import sys
import subprocess
import time
import shutil
import pymupdf

OUTPUT_DIR = os.path.abspath('project_report_src')
os.makedirs(OUTPUT_DIR, exist_ok=True)
ASSETS_DIR = os.path.join(OUTPUT_DIR, 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

HTML_PATH = os.path.join(OUTPUT_DIR, 'project_report.html')
PDF_PATH = os.path.abspath('AI_Powered_Multi_Crop_Leaf_Disease_Classification_Project_Report.pdf')
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# Import page modules
sys.path.append(os.path.abspath('.'))
from scripts.report_builder_core import make_page
from scripts.report_content_front_matter import get_front_matter_pages
from scripts.report_content_ch1_ch2 import get_chapter1_and_chapter2_pages
from scripts.report_content_ch3 import get_chapter3_pages
from scripts.report_content_ch4_ch5_appendices import get_ch4_ch5_appendices_pages

CSS_STYLE = '''
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    margin: 0;
    padding: 0;
    background: #e5e7eb;
    font-family: "Times New Roman", Times, "Nimbus Roman No9 L", serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #111827;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 22mm 22mm 22mm 30mm;
    margin: 10px auto;
    background: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    overflow: hidden;
  }
  @media print {
    body {
      background: none;
    }
    .page {
      margin: 0;
      box-shadow: none;
      width: 210mm;
      height: 297mm;
    }
  }
  
  .header-rule {
    position: absolute;
    top: 13mm;
    left: 30mm;
    right: 22mm;
    font-size: 9.5pt;
    font-style: italic;
    color: #374151;
    border-bottom: 0.75pt solid #4b5563;
    padding-bottom: 2.5mm;
    text-align: right;
  }
  .footer-rule {
    position: absolute;
    bottom: 12mm;
    left: 30mm;
    right: 22mm;
    font-size: 9.5pt;
    font-style: italic;
    color: #374151;
    border-top: 0.75pt solid #4b5563;
    padding-top: 2.5mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .page-body {
    padding-top: 6mm;
    height: 242mm;
    overflow: hidden;
  }
  
  /* Academic Typography */
  h1.chapter-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 8px 0 16px 0;
    color: #000;
  }
  .chapter-number {
    font-size: 13pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 4px;
    color: #000;
  }
  h2.section-title {
    font-size: 12pt;
    font-weight: bold;
    margin: 14px 0 6px 0;
    color: #000;
  }
  h3.subsection-title {
    font-size: 11pt;
    font-weight: bold;
    margin: 10px 0 4px 0;
    color: #000;
  }
  p {
    text-align: justify;
    text-justify: inter-word;
    margin: 0 0 8px 0;
    text-indent: 20px;
  }
  p.no-indent {
    text-indent: 0;
  }
  
  /* Tables */
  .table-title {
    font-size: 9.5pt;
    margin-top: 8px;
    margin-bottom: 4px;
    text-align: left;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 9pt;
    line-height: 1.35;
  }
  th, td {
    border: 0.75pt solid #4b5563;
    padding: 4px 6px;
    vertical-align: middle;
  }
  th {
    background-color: #f3f4f6;
    font-weight: bold;
    text-align: center;
  }
  td {
    text-align: left;
  }
  
  /* Figures */
  .figure-box {
    text-align: center;
    margin: 8px 0 4px 0;
  }
  .figure-box img {
    max-width: 95%;
    max-height: 210px;
    height: auto;
    object-fit: contain;
    display: inline-block;
  }
  .caption-figure {
    font-size: 9.5pt;
    text-align: center;
    margin-bottom: 8px;
    color: #111827;
  }
  
  /* Front Matter Elements */
  .toc-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 3.5px;
    font-size: 10pt;
    line-height: 1.35;
  }
  .toc-title {
    flex-shrink: 0;
    max-width: 82%;
  }
  .toc-dots {
    flex-grow: 1;
    border-bottom: 1px dotted #4b5563;
    margin: 0 6px;
    height: 1em;
  }
  .toc-page {
    flex-shrink: 0;
    text-align: right;
  }
  
  /* References */
  .ref-item {
    display: flex;
    margin-bottom: 7px;
    font-size: 9.5pt;
    line-height: 1.35;
    text-align: justify;
  }
  .ref-num {
    width: 28px;
    flex-shrink: 0;
    font-weight: bold;
  }
  .ref-text {
    flex-grow: 1;
  }
</style>
'''

def build_report():
    print("Collecting report pages...")
    front_matter = get_front_matter_pages()          # Pages 1 to 12
    ch1_ch2 = get_chapter1_and_chapter2_pages()      # Pages 13 to 23
    ch3 = get_chapter3_pages()                       # Pages 24 to 41
    ch4_ch5_app = get_ch4_ch5_appendices_pages()     # Pages 42 to 56

    all_pages = front_matter + ch1_ch2 + ch3 + ch4_ch5_app

    print(f"Total collected pages: {len(all_pages)}")
    assert len(all_pages) == 56, f"Expected 56 pages, but found {len(all_pages)}!"

    html_content = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="utf-8">',
        '  <title>AI-Powered Multi-Crop Leaf Disease Classification and Farmer Advisory System</title>',
        CSS_STYLE,
        '</head>',
        '<body>'
    ]

    for p in all_pages:
        page_num, arabic_num, chapter_title, content_html, is_front_matter, has_header = p
        page_markup = make_page(page_num, arabic_num, chapter_title, content_html, is_front_matter, has_header)
        html_content.append(page_markup)

    html_content.append('</body>')
    html_content.append('</html>')

    final_html = "\n".join(html_content)
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(final_html)

    print(f"Master HTML generated at: {HTML_PATH} ({len(final_html)} bytes)")

    # Render PDF using Headless Chrome
    print("Invoking Chrome to render PDF...")
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={PDF_PATH}",
        HTML_PATH
    ]
    subprocess.run(cmd, check=True)
    time.sleep(2)

    if os.path.exists(PDF_PATH):
        pdf_size = os.path.getsize(PDF_PATH)
        doc = pymupdf.open(PDF_PATH)
        actual_page_count = len(doc)
        print(f"PDF Successfully Generated!")
        print(f"Path: {PDF_PATH}")
        print(f"Size: {pdf_size:,} bytes")
        print(f"Page Count: {actual_page_count}")
        return actual_page_count
    else:
        print("Error: PDF was not created!")
        return 0

if __name__ == '__main__':
    build_report()
