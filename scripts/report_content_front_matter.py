"""
Front matter pages (Pages 1-12) for B.Tech Project Report.
"""

def get_front_matter_pages():
    pages = []
    
    # ----------------------------------------------------
    # PAGE 1: TITLE PAGE
    # ----------------------------------------------------
    p1 = '''
    <div class="title-page" style="text-align:center; padding: 20px 0;">
      <div style="margin-top: 10px;">
        <h1 class="title-main" style="font-size: 15pt; line-height: 1.4; margin-bottom: 24px;">
          AI-POWERED MULTI-CROP LEAF DISEASE CLASSIFICATION AND FARMER ADVISORY SYSTEM
        </h1>
        <p style="font-size: 11pt; font-weight: bold; margin-bottom: 6px;">PROJECT PHASE I REPORT</p>
        <p style="font-size: 10.5pt; font-style: italic; margin-bottom: 14px;">submitted by</p>
        <p style="font-size: 12pt; font-weight: bold; margin-bottom: 2px;">JOEL THOMAS JACOB</p>
        <p style="font-size: 11pt; font-weight: bold; margin-bottom: 20px;">AJC23CS119</p>
      </div>

      <div style="margin: 10px 0;">
        <p style="font-size: 10pt; font-style: italic; margin-bottom: 4px;">to</p>
        <p style="font-size: 11pt; line-height: 1.4; margin-bottom: 4px;">
          the APJ Abdul Kalam Technological University<br>
          in partial fulfillment of the requirement for the award of the Degree<br>
          of
        </p>
        <p style="font-size: 12pt; font-weight: bold; margin-bottom: 2px;">Bachelor of Technology</p>
        <p style="font-size: 10pt; font-style: italic; margin-bottom: 2px;">in</p>
        <p style="font-size: 11pt; font-weight: bold; margin-bottom: 16px;">Computer Science and Engineering</p>
        
        <p style="font-size: 10pt; font-style: italic; margin-bottom: 4px;">Under the guidance of</p>
        <p style="font-size: 11.5pt; font-weight: bold; margin-bottom: 2px;">[Supervisor Name]</p>
        <p style="font-size: 10.5pt; margin-bottom: 16px;">Assistant Professor</p>
      </div>

      <div style="margin-top: 10px;">
        <img src="assets/emblem_amal_jyothi.png" alt="Amal Jyothi College Emblem" style="width: 135px; height: auto; margin-bottom: 12px;">
        <p style="font-size: 12pt; font-weight: bold; margin-bottom: 4px;">Department of Computer Science and Engineering</p>
        <p style="font-size: 10.5pt; line-height: 1.35; margin-bottom: 4px;">
          Amal Jyothi College of Engineering (Autonomous)<br>
          Kanjirappally-686518
        </p>
        <p style="font-size: 11pt; font-weight: bold; margin-top: 12px;">October 2026</p>
      </div>
    </div>
    '''
    pages.append((1, "", "", p1, True, False))

    # ----------------------------------------------------
    # PAGE 2: DECLARATION
    # ----------------------------------------------------
    p2 = '''
    <div style="padding-top: 35px;">
      <h1 class="chapter-title" style="margin-bottom: 30px;">DECLARATION</h1>
      
      <p style="text-indent: 0; line-height: 1.65; margin-bottom: 20px;">
        I, the undersigned, hereby declare that the project report entitled <b>“AI-Powered Multi-Crop Leaf Disease Classification and Farmer Advisory System”</b>, submitted in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology of the APJ Abdul Kalam Technological University, Kerala, is a bonafide work carried out by me under the supervision of [Supervisor Name], Assistant Professor, Department of Computer Science and Engineering.
      </p>

      <p style="text-indent: 0; line-height: 1.65; margin-bottom: 20px;">
        This report presents my own understanding of the subject in my own words, and wherever the ideas, results or words of others have been used, they have been adequately and accurately cited and referenced. I further declare that I have adhered to the ethics of academic honesty and integrity and that no data, result, reference or fact has been fabricated or misrepresented in this report.
      </p>

      <p style="text-indent: 0; line-height: 1.65; margin-bottom: 30px;">
        Results quoted from published studies are attributed to their original authors. I understand that any violation of the above will be a cause for disciplinary action by the Institute and/or the University, and may also invite penal action from the sources which have not been properly cited or from whom proper permission has not been obtained. This report has not previously formed the basis for the award of any degree, diploma or similar title of any other University or Institute.
      </p>

      <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <p style="margin: 0; line-height: 1.4;">Kanjirappally</p>
          <p style="margin: 0; line-height: 1.4;">Date: 24-10-2026</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold; font-size: 11pt;">JOEL THOMAS JACOB</p>
        </div>
      </div>
    </div>
    '''
    pages.append((2, "", "", p2, True, False))

    # ----------------------------------------------------
    # PAGE 3: CERTIFICATE
    # ----------------------------------------------------
    p3 = '''
    <div style="padding-top: 25px; text-align: center;">
      <p style="font-size: 11pt; font-weight: bold; margin: 0; text-transform: uppercase;">Dept. of Computer Science and Engineering</p>
      <p style="font-size: 10.5pt; font-weight: bold; margin: 2px 0 0; text-transform: uppercase;">Amal Jyothi College of Engineering (Autonomous)</p>
      <p style="font-size: 10pt; font-weight: bold; margin: 2px 0 16px; text-transform: uppercase;">Kanjirappally</p>

      <img src="assets/emblem_amal_jyothi.png" alt="Amal Jyothi College Emblem" style="width: 100px; height: auto; margin-bottom: 16px;">

      <h1 class="chapter-title" style="margin: 12px 0 24px;">CERTIFICATE</h1>

      <p style="text-align: justify; line-height: 1.65; margin-bottom: 30px;">
        This is to certify that the report entitled <b>“AI-Powered Multi-Crop Leaf Disease Classification and Farmer Advisory System”</b> submitted by <b>Joel Thomas Jacob (AJC23CS119)</b> to the APJ Abdul Kalam Technological University in partial fulfillment of the requirements for the award of the Degree of Bachelor of Technology in Computer Science and Engineering is a bonafide record of the project work carried out by him under my guidance and supervision. This report in any form has not been submitted to any other University or Institute for any purpose.
      </p>

      <div style="margin-top: 80px; display: flex; justify-content: space-between; text-align: left;">
        <div>
          <p style="margin: 0; font-weight: bold;">[Supervisor Name]</p>
          <p style="margin: 0; font-size: 10pt; color: #444;">Internal Supervisor</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold;">[Project Coordinator Name]</p>
          <p style="margin: 0; font-size: 10pt; color: #444;">Project Coordinator</p>
        </div>
      </div>

      <div style="margin-top: 55px; text-align: center;">
        <p style="margin: 0; font-weight: bold;">Dr. Juby Mathew</p>
        <p style="margin: 0; font-size: 10pt; color: #444;">Head of Department, CSE</p>
      </div>
    </div>
    '''
    pages.append((3, "", "", p3, True, False))

    # ----------------------------------------------------
    # PAGE 4: ACKNOWLEDGEMENT (iii)
    # ----------------------------------------------------
    p4 = '''
    <div style="padding-top: 20px;">
      <h1 class="chapter-title">ACKNOWLEDGEMENT</h1>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        First of all, I sincerely thank the Almighty God for the knowledge, health and courage that enabled me to carry out this project work successfully.
      </p>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        I derive immense pleasure in expressing my sincere thanks to our Manager, <b>Rev. Fr. Boby Alex Mannamplackal</b>, our Director (Administrator), <b>Fr. Dr. Roy Abraham Pazhayaparampil</b>, and our Principal, <b>Dr. Lillykutty Jacob</b>, for providing excellent academic facilities, laboratory resources, and a highly supportive educational environment for conducting this research and engineering work.
      </p>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        I express my deep gratitude to <b>Dr. Juby Mathew</b>, Head of the Department of Computer Science and Engineering, for his continuous encouragement, technical leadership, and administrative support throughout the execution of this project.
      </p>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        I am profoundly thankful to my internal guide and Project Coordinator, <b>[Supervisor Name]</b>, Assistant Professor, for her expert guidance, insightful technical critique, constructive suggestions, constant motivation, and diligent coordination of the project milestones.
      </p>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        I am grateful to all the faculty members and technical staff of the Department of Computer Science and Engineering for their valuable academic insights and support. I also thank my classmates and fellow project peers for their constructive discussions, cooperative sharing of technical tools, and constant encouragement.
      </p>

      <p style="line-height: 1.6; margin-bottom: 24px;">
        Finally, I convey my heartfelt thanks and deepest debt of gratitude to my parents and family for their unconditional love, moral support, patience, and prayers throughout my academic studies.
      </p>

      <div style="text-align: right; margin-top: 30px;">
        <p style="font-weight: bold; margin: 0;">JOEL THOMAS JACOB</p>
      </div>
    </div>
    '''
    pages.append((4, "iii", "", p4, True, False))

    # ----------------------------------------------------
    # PAGE 5: ABSTRACT (iv)
    # ----------------------------------------------------
    p5 = '''
    <div style="padding-top: 20px;">
      <h1 class="chapter-title">ABSTRACT</h1>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        Foliar plant diseases represent a critical threat to global agricultural food security, reducing crop yields by an estimated 20% to 40% annually across major horticultural staples. In smallholder farming communities across developing regions, visual disease identification is hampered by a lack of accessible agronomic specialists, laboratory facilities, and visual mimicry among fungal, bacterial, and viral pathogens.
      </p>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        This project presents an integrated, edge-deployable, multi-crop plant leaf disease classification and farmer advisory platform. The system supports three economically vital regional crops—Tomato (<i>Solanum lycopersicum</i>), Potato (<i>Solanum tuberosum</i>), and Chilli Pepper (<i>Capsicum annuum</i>)—encompassing twenty-one distinct pathology and healthy foliage categories. The platform translates recent advances in deep learning into an accessible Progressive Web Application (PWA) operating directly within modern smartphone and desktop web browsers.
      </p>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        The system architecture combines three specialized neural classification models executed via ONNX Runtime WebAssembly (WASM): a fine-tuned MobileNetV3 V2 compound architecture for tomato pathology (10 classes), an optimized CNN for potato blights (3 classes), and a dedicated classifier for chilli infections and nutritional deficiencies (8 classes). To guard against unreliable field predictions, the platform implements a multi-stage input validation pipeline incorporating Laplacian blur estimation, luminance checking, and softmax entropy-based uncertainty calibration with a 60% confidence threshold gating mechanism. Predictions are matched with actionable agricultural advisory protocols detailing cultural management, organic remedies, and approved chemical treatments.
      </p>

      <p style="line-height: 1.6; margin-bottom: 14px;">
        The platform was empirically evaluated using standardized datasets and curated photographic reference libraries. On validation datasets, the MobileNetV3 V2 tomato classifier achieved 99.56% accuracy on clean benchmark samples and 89.4% macro-averaged validation accuracy across multi-crop field conditions. System latency testing demonstrated sub-second inference execution (110–180 ms) on consumer mobile devices without server dependency or data transmission costs, demonstrating the viability of private, edge-native AI for frontline precision agriculture.
      </p>
    </div>
    '''
    pages.append((5, "iv", "", p5, True, False))

    # ----------------------------------------------------
    # PAGES 6-8: CONTENTS (v, vi, vii)
    # ----------------------------------------------------
    p6 = '''
    <div style="padding-top: 15px;">
      <h1 class="chapter-title" style="margin-bottom: 18px;">CONTENTS</h1>

      <div class="toc-line"><span class="toc-title"><b>ACKNOWLEDGEMENT</b></span><span class="toc-dots"></span><span class="toc-page">iii</span></div>
      <div class="toc-line"><span class="toc-title"><b>ABSTRACT</b></span><span class="toc-dots"></span><span class="toc-page">iv</span></div>
      <div class="toc-line"><span class="toc-title"><b>LIST OF TABLES</b></span><span class="toc-dots"></span><span class="toc-page">viii</span></div>
      <div class="toc-line"><span class="toc-title"><b>LIST OF FIGURES</b></span><span class="toc-dots"></span><span class="toc-page">ix</span></div>
      <div class="toc-line"><span class="toc-title"><b>ABBREVIATIONS</b></span><span class="toc-dots"></span><span class="toc-page">xi</span></div>

      <div class="toc-line" style="margin-top: 10px;"><span class="toc-title"><b>1 Introduction</b></span><span class="toc-dots"></span><span class="toc-page">1</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">1.1 Overview</span><span class="toc-dots"></span><span class="toc-page">1</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">1.2 Motivation and Objective</span><span class="toc-dots"></span><span class="toc-page">2</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">1.3 Report Organization</span><span class="toc-dots"></span><span class="toc-page">4</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">1.4 Scope and Status of This Work</span><span class="toc-dots"></span><span class="toc-page">4</span></div>

      <div class="toc-line" style="margin-top: 10px;"><span class="toc-title"><b>2 Literature Survey</b></span><span class="toc-dots"></span><span class="toc-page">5</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">2.1 Deep Learning for Plant Pathology</span><span class="toc-dots"></span><span class="toc-page">5</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.1.1 Foundational CNN Architectures on Benchmark Datasets</span><span class="toc-dots"></span><span class="toc-page">5</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.1.2 Deep Residual Learning and Multi-Scale Extraction</span><span class="toc-dots"></span><span class="toc-page">6</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.1.3 Transfer Learning from General-Domain Ensembles</span><span class="toc-dots"></span><span class="toc-page">6</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">2.2 Mobile Edge Vision Architectures</span><span class="toc-dots"></span><span class="toc-page">7</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.2.1 Depthwise Separable Convolutions & MobileNet Backbones</span><span class="toc-dots"></span><span class="toc-page">7</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.2.2 Hard-Swish and Channel Attention Mechanisms</span><span class="toc-dots"></span><span class="toc-page">7</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">2.3 Foliar Object Detection and Leaf ROI Extraction</span><span class="toc-dots"></span><span class="toc-page">8</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.3.1 YOLO Single-Shot Detectors for Complex Field Scenes</span><span class="toc-dots"></span><span class="toc-page">8</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">2.4 Agricultural Benchmarks & Laboratory-to-Field Gap</span><span class="toc-dots"></span><span class="toc-page">8</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.4.1 Controlled Laboratory Datasets: PlantVillage</span><span class="toc-dots"></span><span class="toc-page">8</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.4.2 In-Field Open Benchmark Studies: PlantDoc</span><span class="toc-dots"></span><span class="toc-page">9</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.4.3 Mendeley and South Asian Horticultural Datasets</span><span class="toc-dots"></span><span class="toc-page">9</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">2.4.4 Domain Adaptation and Generalization Challenges</span><span class="toc-dots"></span><span class="toc-page">9</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">2.5 Explainability and Confidence Calibration in Agronomic AI</span><span class="toc-dots"></span><span class="toc-page">10</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">2.6 Summary and Research Gap</span><span class="toc-dots"></span><span class="toc-page">10</span></div>

      <div class="toc-line" style="margin-top: 10px;"><span class="toc-title"><b>3 System Design, Methodology and Implementation</b></span><span class="toc-dots"></span><span class="toc-page">12</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.1 Requirement Analysis</span><span class="toc-dots"></span><span class="toc-page">12</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.1.1 Hardware Specifications</span><span class="toc-dots"></span><span class="toc-page">12</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.1.2 Software Specifications</span><span class="toc-dots"></span><span class="toc-page">12</span></div>
    </div>
    '''
    pages.append((6, "v", "", p6, True, False))

    p7 = '''
    <div style="padding-top: 15px;">
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.2 System Overview</span><span class="toc-dots"></span><span class="toc-page">13</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.3 Three-Tier Implementation Architecture</span><span class="toc-dots"></span><span class="toc-page">14</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.4 Multi-Model ML Pipeline</span><span class="toc-dots"></span><span class="toc-page">14</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.5 User Roles and Modules</span><span class="toc-dots"></span><span class="toc-page">15</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.5.1 Farmer / Grower Module</span><span class="toc-dots"></span><span class="toc-page">15</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.5.2 Agronomist / Extension Officer Module</span><span class="toc-dots"></span><span class="toc-page">16</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.5.3 System Administrator Module</span><span class="toc-dots"></span><span class="toc-page">17</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.6 Dataset and Data Collection</span><span class="toc-dots"></span><span class="toc-page">17</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.7 Data Preprocessing</span><span class="toc-dots"></span><span class="toc-page">18</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.8 Machine Learning Methodology</span><span class="toc-dots"></span><span class="toc-page">19</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.9 Multi-Crop Classification Models</span><span class="toc-dots"></span><span class="toc-page">20</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.9.1 Tomato Disease Classifier (MobileNetV3 V2)</span><span class="toc-dots"></span><span class="toc-page">21</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.9.2 Potato Disease Classifier</span><span class="toc-dots"></span><span class="toc-page">22</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.9.3 Chilli Disease Classifier</span><span class="toc-dots"></span><span class="toc-page">22</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.10 Image Quality Inspection and Uncertainty Gating</span><span class="toc-dots"></span><span class="toc-page">22</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.10.1 Laplacian Blur and Luminance Quality Metric</span><span class="toc-dots"></span><span class="toc-page">22</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.10.2 Softmax Entropy and Margin Thresholding</span><span class="toc-dots"></span><span class="toc-page">23</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.11 Deep Learning Backbones & Inverted Residual Architecture</span><span class="toc-dots"></span><span class="toc-page">23</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.11.1 MobileNetV3 Compound Inverted Residual Blocks</span><span class="toc-dots"></span><span class="toc-page">24</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.11.2 Training Configuration and Transfer Learning</span><span class="toc-dots"></span><span class="toc-page">24</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.12 Backend Architecture</span><span class="toc-dots"></span><span class="toc-page">25</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.12.1 REST API Endpoints and Serverless Handlers</span><span class="toc-dots"></span><span class="toc-page">25</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.13 Frontend Implementation</span><span class="toc-dots"></span><span class="toc-page">26</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.14 Database Design</span><span class="toc-dots"></span><span class="toc-page">27</span></div>
      <div class="toc-line" style="padding-left: 32px;"><span class="toc-title">3.14.1 Dual Persistence and Cloud Integration</span><span class="toc-dots"></span><span class="toc-page">28</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.15 Security, Data Handling, and Role-Based Access</span><span class="toc-dots"></span><span class="toc-page">28</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">3.16 System Workflow</span><span class="toc-dots"></span><span class="toc-page">29</span></div>

      <div class="toc-line" style="margin-top: 10px;"><span class="toc-title"><b>4 Results and Discussion</b></span><span class="toc-dots"></span><span class="toc-page">30</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.1 Current Status of the System</span><span class="toc-dots"></span><span class="toc-page">30</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.2 Multi-Crop Model Performance</span><span class="toc-dots"></span><span class="toc-page">30</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.3 Quality Check & Rejection Validation</span><span class="toc-dots"></span><span class="toc-page">33</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.4 Out-of-Domain Rejection Evaluation</span><span class="toc-dots"></span><span class="toc-page">33</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.5 System Integration Testing</span><span class="toc-dots"></span><span class="toc-page">33</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.6 Results Reported in the Literature</span><span class="toc-dots"></span><span class="toc-page">34</span></div>
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.7 Discussion</span><span class="toc-dots"></span><span class="toc-page">34</span></div>
    </div>
    '''
    pages.append((7, "vi", "", p7, True, False))

    p8 = '''
    <div style="padding-top: 15px;">
      <div class="toc-line" style="padding-left: 16px;"><span class="toc-title">4.8 Limitations</span><span class="toc-dots"></span><span class="toc-page">35</span></div>

      <div class="toc-line" style="margin-top: 10px;"><span class="toc-title"><b>5 Conclusion and Future Work</b></span><span class="toc-dots"></span><span class="toc-page">36</span></div>

      <div class="toc-line" style="margin-top: 10px;"><span class="toc-title"><b>REFERENCES</b></span><span class="toc-dots"></span><span class="toc-page">37</span></div>

      <div class="toc-line" style="margin-top: 10px;"><span class="toc-title"><b>APPENDIX A: PROJECT TIMELINE</b></span><span class="toc-dots"></span><span class="toc-page">39</span></div>
      <div class="toc-line" style="margin-top: 6px;"><span class="toc-title"><b>APPENDIX B: SCREENSHOTS</b></span><span class="toc-dots"></span><span class="toc-page">40</span></div>
      <div class="toc-line" style="margin-top: 6px;"><span class="toc-title"><b>APPENDIX C: DETAILED DISEASE-CLASS INVENTORY</b></span><span class="toc-dots"></span><span class="toc-page">43</span></div>
      <div class="toc-line" style="margin-top: 6px;"><span class="toc-title"><b>DEPARTMENT VISION, MISSION AND OUTCOMES</b></span><span class="toc-dots"></span><span class="toc-page">44</span></div>
    </div>
    '''
    pages.append((8, "vii", "", p8, True, False))

    # ----------------------------------------------------
    # PAGE 9: LIST OF TABLES (viii)
    # ----------------------------------------------------
    p9 = '''
    <div style="padding-top: 15px;">
      <h1 class="chapter-title">LIST OF TABLES</h1>

      <div class="toc-line"><span class="toc-title">2.1: Literature survey comparison</span><span class="toc-dots"></span><span class="toc-page">11</span></div>
      <div class="toc-line"><span class="toc-title">3.1: Hardware requirements</span><span class="toc-dots"></span><span class="toc-page">12</span></div>
      <div class="toc-line"><span class="toc-title">3.2: Software requirements</span><span class="toc-dots"></span><span class="toc-page">13</span></div>
      <div class="toc-line"><span class="toc-title">3.3: Comparison of the three multi-crop decision-support models</span><span class="toc-dots"></span><span class="toc-page">15</span></div>
      <div class="toc-line"><span class="toc-title">3.4: Farmer module</span><span class="toc-dots"></span><span class="toc-page">16</span></div>
      <div class="toc-line"><span class="toc-title">3.5: Agronomist module</span><span class="toc-dots"></span><span class="toc-page">17</span></div>
      <div class="toc-line"><span class="toc-title">3.6: Admin module</span><span class="toc-dots"></span><span class="toc-page">17</span></div>
      <div class="toc-line"><span class="toc-title">3.7: Dataset characteristics and suitability</span><span class="toc-dots"></span><span class="toc-page">18</span></div>
      <div class="toc-line"><span class="toc-title">3.8: Preprocessing operations and tensor transformations</span><span class="toc-dots"></span><span class="toc-page">19</span></div>
      <div class="toc-line"><span class="toc-title">3.9: Tomato foliar disease classes (MobileNetV3 V2)</span><span class="toc-dots"></span><span class="toc-page">21</span></div>
      <div class="toc-line"><span class="toc-title">3.10: Image quality thresholds and uncertainty metrics</span><span class="toc-dots"></span><span class="toc-page">23</span></div>
      <div class="toc-line"><span class="toc-title">3.11: MobileNetV3 training and transfer learning hyperparameters</span><span class="toc-dots"></span><span class="toc-page">25</span></div>
      <div class="toc-line"><span class="toc-title">3.12: Application REST API endpoints and serverless routes</span><span class="toc-dots"></span><span class="toc-page">26</span></div>
      <div class="toc-line"><span class="toc-title">3.13: Conceptual database entities</span><span class="toc-dots"></span><span class="toc-page">28</span></div>
      <div class="toc-line"><span class="toc-title">4.1: System components and status</span><span class="toc-dots"></span><span class="toc-page">30</span></div>
      <div class="toc-line"><span class="toc-title">4.2: Overall classification performance on held-out validation sets</span><span class="toc-dots"></span><span class="toc-page">31</span></div>
      <div class="toc-line"><span class="toc-title">4.3: Per-class performance metrics for tomato leaf pathology</span><span class="toc-dots"></span><span class="toc-page">32</span></div>
      <div class="toc-line"><span class="toc-title">4.4: Image quality inspection and rejection validation</span><span class="toc-dots"></span><span class="toc-page">33</span></div>
      <div class="toc-line"><span class="toc-title">4.5: End-to-end workflows tested</span><span class="toc-dots"></span><span class="toc-page">34</span></div>
      <div class="toc-line"><span class="toc-title">4.6: Results reported in existing literature</span><span class="toc-dots"></span><span class="toc-page">34</span></div>
      <div class="toc-line"><span class="toc-title">A.1: Project phases and schedule</span><span class="toc-dots"></span><span class="toc-page">39</span></div>
      <div class="toc-line"><span class="toc-title">C.1: Complete 21-Disease Class Inventory and Management Protocol</span><span class="toc-dots"></span><span class="toc-page">43</span></div>
    </div>
    '''
    pages.append((9, "viii", "", p9, True, False))

    # ----------------------------------------------------
    # PAGES 10-11: LIST OF FIGURES (ix, x)
    # ----------------------------------------------------
    p10 = '''
    <div style="padding-top: 15px;">
      <h1 class="chapter-title">LIST OF FIGURES</h1>

      <div class="toc-line"><span class="toc-title">1.1: Multi-crop agricultural decision-support concept</span><span class="toc-dots"></span><span class="toc-page">2</span></div>
      <div class="toc-line"><span class="toc-title">2.1: Classification of the reviewed literature</span><span class="toc-dots"></span><span class="toc-page">5</span></div>
      <div class="toc-line"><span class="toc-title">3.1: Overall system architecture</span><span class="toc-dots"></span><span class="toc-page">13</span></div>
      <div class="toc-line"><span class="toc-title">3.2: Three-tier implementation architecture showing presentation, application, and intelligence layers</span><span class="toc-dots"></span><span class="toc-page">14</span></div>
      <div class="toc-line"><span class="toc-title">3.3: Crop-specific model-routing flowchart across Tomato, Potato, and Chilli</span><span class="toc-dots"></span><span class="toc-page">15</span></div>
      <div class="toc-line"><span class="toc-title">3.4: Farmer workflow</span><span class="toc-dots"></span><span class="toc-page">16</span></div>
      <div class="toc-line"><span class="toc-title">3.5: Agronomist workflow</span><span class="toc-dots"></span><span class="toc-page">17</span></div>
      <div class="toc-line"><span class="toc-title">3.6: Admin workflow</span><span class="toc-dots"></span><span class="toc-page">17</span></div>
      <div class="toc-line"><span class="toc-title">3.7: Deep learning training and transfer learning pipeline</span><span class="toc-dots"></span><span class="toc-page">20</span></div>
      <div class="toc-line"><span class="toc-title">3.8: Foliar disease classification inference pipeline</span><span class="toc-dots"></span><span class="toc-page">21</span></div>
      <div class="toc-line"><span class="toc-title">3.9: Image preprocessing and tensor normalization flow</span><span class="toc-dots"></span><span class="toc-page">21</span></div>
      <div class="toc-line"><span class="toc-title">3.10: Quality inspection and uncertainty gating flow</span><span class="toc-dots"></span><span class="toc-page">23</span></div>
      <div class="toc-line"><span class="toc-title">3.11: Multi-crop foliar feature extraction and inference pipeline</span><span class="toc-dots"></span><span class="toc-page">24</span></div>
      <div class="toc-line"><span class="toc-title">3.12: MobileNetV3 inverted residual block with squeeze-and-excitation</span><span class="toc-dots"></span><span class="toc-page">24</span></div>
      <div class="toc-line"><span class="toc-title">3.13: Backend architecture and service orchestration</span><span class="toc-dots"></span><span class="toc-page">25</span></div>
      <div class="toc-line"><span class="toc-title">3.14: Database / ER diagram (conceptual)</span><span class="toc-dots"></span><span class="toc-page">27</span></div>
      <div class="toc-line"><span class="toc-title">3.15: Complete system workflow</span><span class="toc-dots"></span><span class="toc-page">29</span></div>
      <div class="toc-line"><span class="toc-title">4.1: CNN training and validation loss and accuracy over 25 epochs</span><span class="toc-dots"></span><span class="toc-page">31</span></div>
      <div class="toc-line"><span class="toc-title">4.2: Confusion matrix for tomato foliar disease classification</span><span class="toc-dots"></span><span class="toc-page">31</span></div>
      <div class="toc-line"><span class="toc-title">4.3: One-vs-rest ROC curves for representative disease classes</span><span class="toc-dots"></span><span class="toc-page">32</span></div>
      <div class="toc-line"><span class="toc-title">B.1: Main application home screen showing multi-crop selection</span><span class="toc-dots"></span><span class="toc-page">40</span></div>
      <div class="toc-line"><span class="toc-title">B.2: Leaf photo upload and live camera acquisition interface</span><span class="toc-dots"></span><span class="toc-page">40</span></div>
    </div>
    '''
    pages.append((10, "ix", "", p10, True, False))

    p11 = '''
    <div style="padding-top: 15px;">
      <div class="toc-line"><span class="toc-title">B.3: Deep learning leaf diagnostic classification and confidence results page</span><span class="toc-dots"></span><span class="toc-page">41</span></div>
      <div class="toc-line"><span class="toc-title">B.4: Comprehensive agronomic advisory and disease treatment recommendation panel</span><span class="toc-dots"></span><span class="toc-page">41</span></div>
      <div class="toc-line"><span class="toc-title">B.5: Photographic leaf comparison across supported crops: Tomato, Potato, and Chilli</span><span class="toc-dots"></span><span class="toc-page">42</span></div>
    </div>
    '''
    pages.append((11, "x", "", p11, True, False))

    # ----------------------------------------------------
    # PAGE 12: LIST OF ABBREVIATIONS (xi)
    # ----------------------------------------------------
    p12 = '''
    <div style="padding-top: 15px;">
      <h1 class="chapter-title">ABBREVIATIONS</h1>

      <table style="width: 100%; border-collapse: collapse; font-size: 10.5pt; line-height: 1.6;">
        <tr><td style="width: 25%; font-weight: bold; padding: 4px 0;">AI</td><td>Artificial Intelligence</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">API</td><td>Application Programming Interface</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">AUC</td><td>Area Under the Curve</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">CNN</td><td>Convolutional Neural Network</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">CPU</td><td>Central Processing Unit</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">CORS</td><td>Cross-Origin Resource Sharing</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">DSS</td><td>Decision Support System</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">EHR</td><td>Electronic Health Record</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">ER</td><td>Entity–Relationship</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">FPR</td><td>False Positive Rate</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">GPU</td><td>Graphics Processing Unit</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">JSON</td><td>JavaScript Object Notation</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">LIME</td><td>Local Interpretable Model-agnostic Explanations</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">ML</td><td>Machine Learning</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">NCHW</td><td>Batch Size, Channels, Height, Width</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">ONNX</td><td>Open Neural Network Exchange</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">PWA</td><td>Progressive Web Application</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">RBAC</td><td>Role-Based Access Control</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">REST</td><td>Representational State Transfer</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">ROC</td><td>Receiver Operating Characteristic</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">ROI</td><td>Region of Interest</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">SAM</td><td>Segment Anything Model</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">SE</td><td>Squeeze-and-Excitation</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">TPR</td><td>True Positive Rate</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">UI</td><td>User Interface</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">VAS</td><td>Visual Analogue Scale</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">WASM</td><td>WebAssembly</td></tr>
        <tr><td style="font-weight: bold; padding: 4px 0;">YOLO</td><td>You Only Look Once</td></tr>
      </table>
    </div>
    '''
    pages.append((12, "xi", "", p12, True, False))

    return pages

print("Front matter pages module created.")
