"""
Master Generator for the 56-page B.Tech Academic Project Report
Title: AI-Powered Multi-Crop Leaf Disease Classification and Farmer Advisory System
Author: Joel Thomas Jacob (AJC23CS119)
Institution: Amal Jyothi College of Engineering (Autonomous), Kanjirappally
"""

import os
import sys
import subprocess
import time
import pymupdf

OUTPUT_DIR = os.path.abspath('project_report_src')
os.makedirs(OUTPUT_DIR, exist_ok=True)
ASSETS_DIR = 'assets'
HTML_PATH = os.path.join(OUTPUT_DIR, 'project_report.html')
PDF_PATH = os.path.abspath('AI_Powered_Multi_Crop_Leaf_Disease_Classification_Project_Report.pdf')
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def make_page(page_num, arabic_num, chapter_title, content_html, is_front_matter=False, has_header=True):
    header_html = ""
    if has_header and chapter_title:
        header_html = f'<div class="header-rule">{chapter_title}</div>'
    
    footer_html = ""
    if is_front_matter:
        roman_nums = {
            1: "", 2: "", 3: "", 4: "iii", 5: "iv", 6: "v", 7: "vi", 8: "vii",
            9: "viii", 10: "ix", 11: "x", 12: "xi"
        }
        r_num = roman_nums.get(page_num, "")
        if r_num:
            footer_html = f'''<div class="footer-rule">
              <span style="visibility:hidden;">Department of Computer Science and Engineering, AJCE</span>
              <span style="font-style:italic; font-size:10pt;">{r_num}</span>
            </div>'''
    else:
        footer_html = f'''<div class="footer-rule">
          <span>Department of Computer Science and Engineering, AJCE</span>
          <span>{arabic_num}</span>
        </div>'''
        
    return f'''
    <div class="page" id="p{page_num}">
      {header_html}
      <div class="page-body">
        {content_html}
      </div>
      {footer_html}
    </div>
    '''

print("Base helper defined.")
