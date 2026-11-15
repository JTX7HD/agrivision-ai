"""
AgriVision AI - B.Tech Project Report HTML Generator
Generates project_report_src/project_report.html matching the 56-page academic structure of Project_Report.pdf.
"""

import os
import json

OUTPUT_HTML = os.path.abspath('project_report_src/project_report.html')
ASSETS_DIR = 'assets'

def build_report_html():
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AI-POWERED MULTI-CROP LEAF DISEASE CLASSIFICATION AND FARMER ADVISORY SYSTEM - Project Report</title>
<style>
  @page {{
    size: A4 portrait;
    margin-top: 25mm;
    margin-bottom: 25mm;
    margin-left: 30mm; /* 1.25 in for academic binding */
    margin-right: 22mm;
    @top-right {{
      content: string(chapter_title);
      font-family: 'Times New Roman', Times, serif;
      font-style: italic;
      font-size: 10pt;
      color: #333333;
    }}
    @bottom-left {{
      content: "Department of Computer Science and Engineering, AJCE";
      font-family: 'Times New Roman', Times, serif;
      font-style: italic;
      font-size: 10pt;
      color: #333333;
    }}
    @bottom-right {{
      content: counter(page);
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #333333;
    }}
  }}

  * {{
    box-sizing: border-box;
  }}

  body {{
    font-family: 'Times New Roman', Times, Georgia, serif;
    font-size: 12pt;
    line-height: 1.55;
    color: #111111;
    margin: 0;
    padding: 0;
    text-align: justify;
  }}

  .page {{
    page-break-before: always;
    position: relative;
    min-height: 247mm; /* Printable height within A4 margins */
  }}

  .first-page {{
    page-break-before: avoid;
  }}

  /* Running Header & Footer simulation for browser print */
  .header-rule {{
    display: flex;
    justify-content: flex-end;
    border-bottom: 1px solid #333333;
    padding-bottom: 4px;
    margin-bottom: 24px;
    font-style: italic;
    font-size: 10pt;
    color: #222222;
  }}

  .footer-rule {{
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #777777;
    padding-top: 4px;
    display: flex;
    justify-content: space-between;
    font-style: italic;
    font-size: 10pt;
    color: #333333;
  }}

  /* Typography */
  h1.chapter-title {{
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin-top: 30px;
    margin-bottom: 24px;
    letter-spacing: 0.5px;
    color: #000000;
  }}

  .chapter-number {{
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 6px;
    color: #000000;
  }}

  h2.section-title {{
    font-size: 13pt;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
    color: #000000;
    text-align: left;
  }}

  h3.subsection-title {{
    font-size: 12pt;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 8px;
    color: #000000;
    text-align: left;
  }}

  p {{
    margin-top: 0;
    margin-bottom: 12px;
    text-indent: 0;
    line-height: 1.55;
  }}

  /* Tables */
  table.academic-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10pt;
    line-height: 1.4;
  }}

  table.academic-table th, table.academic-table td {{
    border: 1px solid #444444;
    padding: 7px 9px;
    text-align: left;
  }}

  table.academic-table th {{
    background-color: #f2f2f2;
    font-weight: bold;
    color: #000000;
  }}

  .caption-table {{
    font-size: 10.5pt;
    font-weight: normal;
    margin-top: 10px;
    margin-bottom: 6px;
    text-align: left;
    color: #111111;
  }}
  .caption-table b {{
    font-weight: bold;
  }}

  .caption-figure {{
    font-size: 10.5pt;
    font-weight: normal;
    margin-top: 8px;
    margin-bottom: 16px;
    text-align: center;
    color: #111111;
  }}
  .caption-figure b {{
    font-weight: bold;
  }}

  /* Figure image container */
  .figure-box {{
    text-align: center;
    margin: 14px 0 6px;
  }}

  .figure-box img {{
    max-width: 96%;
    height: auto;
    border: 1px solid #cccccc;
    border-radius: 4px;
    padding: 3px;
    background: #ffffff;
  }}

  /* Lists */
  ol.academic-list, ul.academic-list {{
    margin-top: 4px;
    margin-bottom: 12px;
    padding-left: 28px;
  }}

  ol.academic-list li, ul.academic-list li {{
    margin-bottom: 6px;
    line-height: 1.5;
  }}

  /* Front matter specific */
  .title-page {{
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 245mm;
    padding: 10px 0;
  }}

  .title-main {{
    font-size: 16pt;
    font-weight: bold;
    line-height: 1.35;
    text-transform: uppercase;
    color: #000000;
  }}

  .emblem-img {{
    width: 140px;
    height: auto;
    margin: 16px auto;
  }}

  /* TOC leaders */
  .toc-line {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 6px 0;
    font-size: 11pt;
  }}
  .toc-title {{
    background: white;
    padding-right: 6px;
  }}
  .toc-dots {{
    flex-grow: 1;
    border-bottom: 1px dotted #555555;
    margin: 0 4px;
    position: relative;
    top: -4px;
  }}
  .toc-page {{
    background: white;
    padding-left: 6px;
    font-weight: bold;
  }}

  /* Math equation box */
  .equation-box {{
    text-align: center;
    margin: 14px 0;
    font-style: italic;
    font-size: 11pt;
    background: #fbfbfb;
    border: 1px solid #eeeeee;
    padding: 8px;
    border-radius: 6px;
  }}

  .equation-number {{
    float: right;
    font-style: normal;
    font-weight: bold;
  }}
</style>
</head>
<body>
"""
    return html

print("Report generator framework initialized.")
