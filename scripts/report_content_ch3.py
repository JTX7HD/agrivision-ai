"""
Chapter 3: System Design, Methodology and Implementation (Pages 24-41 / Arabic 12-29).
Strictly formatted for A4 pages in the B.Tech academic project report.
"""

def get_chapter3_pages():
    pages = []

    # ====================================================
    # PAGE 24 (Arabic 12): Ch 3 Title, Intro, Requirements
    # ====================================================
    p24 = '''
    <div>
      <div class="chapter-number">CHAPTER 3</div>
      <h1 class="chapter-title" style="margin-top: 6px; margin-bottom: 16px;">SYSTEM DESIGN, METHODOLOGY AND IMPLEMENTATION</h1>

      <p>
        This chapter describes the requirements analysis, system architecture, multi-crop model routing, dataset curation, deep learning methodology, and software implementation of the developed plant leaf disease classification and farmer advisory platform. Sections 3.1 to 3.4 establish the formal hardware/software specifications, high-level architecture, and the three-model machine learning pipeline. Sections 3.5 to 3.8 detail user roles, dataset characteristics, image preprocessing protocols, and learning formulations. Sections 3.9 to 3.12 explain the dedicated crop classifiers, input quality inspection, neural backbones, and backend service interfaces. Finally, Sections 3.13 to 3.16 present the frontend engineering, persistence design, security safeguards, and end-to-end system workflow.
      </p>

      <h2 class="section-title">3.1 Requirement Analysis</h2>
      <p>
        Engineering an automated diagnostic system for frontline agricultural deployment demands a rigorous balance between classification accuracy and edge computational efficiency. Because the primary user base comprises smallholder farmers operating in rural settings with constrained mobile hardware and unreliable cellular networks, system specifications were formulated to minimize computational footprint while maintaining diagnostic fidelity.
      </p>

      <h3 class="subsection-title">3.1.1 Hardware Specifications</h3>
      <p>
        The hardware requirements are stratified into client runtime environments (farmer smartphones or field tablets) and developer/training workstations, as summarized in Table 3.1. Edge inference operates entirely on standard mobile processors without requiring specialized neural accelerators.
      </p>

      <div class="table-title"><b>Table 3.1:</b> Hardware requirements</div>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Component</th>
            <th style="width: 40%;">Minimum Requirement</th>
            <th style="width: 40%;">Recommended Specification</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Client Processor</td>
            <td>ARM Cortex-A53 quad-core (1.5 GHz)</td>
            <td>ARM Cortex-A75 / Apple Silicon octa-core</td>
          </tr>
          <tr>
            <td>Client Memory</td>
            <td>2 GB LPDDR3 RAM</td>
            <td>4 GB LPDDR4X RAM or higher</td>
          </tr>
          <tr>
            <td>Camera Module</td>
            <td>5.0 Megapixel with autofocus</td>
            <td>12.0 Megapixel HDR with macro focus</td>
          </tr>
          <tr>
            <td>Client Storage</td>
            <td>50 MB free browser cache space</td>
            <td>100 MB free space for offline model cache</td>
          </tr>
          <tr>
            <td>Training Workstation</td>
            <td>Quad-core CPU, 16 GB RAM, 4 GB GPU</td>
            <td>Intel Core i7/AMD Ryzen 7, 32 GB RAM, NVIDIA RTX 3060 (8 GB VRAM)</td>
          </tr>
        </tbody>
      </table>
    </div>
    '''
    pages.append((24, "12", "Chapter 3. System Design, Methodology and Implementation", p24, False, True))

    # ====================================================
    # PAGE 25 (Arabic 13): Software Specs & System Overview
    # ====================================================
    p25 = '''
    <div>
      <h3 class="subsection-title">3.1.2 Software Specifications</h3>
      <p>
        The developed system is constructed upon modern open-source software frameworks designed for robust client-side machine learning and cross-platform web delivery, as outlined in Table 3.2.
      </p>

      <div class="table-title"><b>Table 3.2:</b> Software requirements</div>
      <table>
        <thead>
          <tr>
            <th style="width: 22%;">Layer</th>
            <th style="width: 78%;">Technology & Environment</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Operating System</td>
            <td>Cross-platform: Android 9.0+, iOS 14.0+, Windows 10/11, Ubuntu 22.04 LTS</td>
          </tr>
          <tr>
            <td>Client Runtime</td>
            <td>Modern Web Browser supporting WebAssembly (Chrome 90+, Safari 14+, Firefox 88+)</td>
          </tr>
          <tr>
            <td>Edge Inference</td>
            <td>ONNX Runtime Web (WASM / WebGL execution providers), SIMD acceleration</td>
          </tr>
          <tr>
            <td>Frontend Stack</td>
            <td>Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS design tokens</td>
          </tr>
          <tr>
            <td>Backend / Serverless</td>
            <td>Python 3.10+, FastAPI / Flask micro-services, Node.js 20+ runtime</td>
          </tr>
          <tr>
            <td>Deep Learning & Training</td>
            <td>PyTorch 2.2+, TorchVision, ONNX SDK, OpenCV, NumPy, Pillow, Scikit-Learn</td>
          </tr>
          <tr>
            <td>Development Tools</td>
            <td>Visual Studio Code, Git, Chrome Developer Tools, Netron model visualizer</td>
          </tr>
        </tbody>
      </table>

      <h2 class="section-title">3.2 System Overview</h2>
      <p>
        The proposed platform provides an intuitive, accessible pathway for agricultural producers to obtain real-time foliar pathology identification and agronomic guidance. Figure 3.1 depicts the high-level architecture of the system.
      </p>

      <div class="figure-box" style="margin: 8px 0;">
        <img src="assets/fig3_1_architecture.png" alt="Overall system architecture" style="max-height: 190px;">
      </div>
      <div class="caption-figure"><b>Figure 3.1:</b> Overall system architecture</div>

      <p>
        The farmer initiates the diagnostic sequence by selecting the crop variety (Tomato, Potato, or Chilli). An optical image of the symptomatic leaf is acquired either through live camera capture or local file upload. The image undergoes client-side automated pre-screening for blur and illumination artifacts. If accepted, the image is passed to the corresponding deep neural network running locally inside the browser. The inference engine outputs disease probabilities, which are mapped to calibrated advisory management protocols.
      </p>
    </div>
    '''
    pages.append((25, "13", "Chapter 3. System Design, Methodology and Implementation", p25, False, True))

    # ====================================================
    # PAGE 26 (Arabic 14): Three-Tier Implementation Arch
    # ====================================================
    p26 = '''
    <div>
      <h2 class="section-title">3.3 Three-Tier Implementation Architecture</h2>
      <p>
        To ensure high responsiveness, data privacy, and zero telemetry overhead in bandwidth-constrained rural regions, the developed platform adopts a decoupled three-tier architectural paradigm, illustrated in Figure 3.2.
      </p>

      <div class="figure-box" style="margin: 8px 0;">
        <img src="assets/fig3_2_architecture.png" alt="Three-tier implementation architecture" style="max-height: 195px;">
      </div>
      <div class="caption-figure"><b>Figure 3.2:</b> Three-tier implementation architecture showing presentation, application, and intelligence layers</div>

      <p>
        <b>1. Presentation Layer (Client PWA):</b> Implemented using Next.js 16 and React 19, this layer renders the responsive farmer interface, handles touch-optimized interactions, guides optical leaf alignment, and displays diagnostic results alongside actionable treatment protocols. It operates as an installable Progressive Web Application capable of working offline.
      </p>
      <p>
        <b>2. Application Orchestration Layer:</b> Implemented in TypeScript and Python micro-services, this layer manages image preprocessing, enforces input quality rejection rules, handles crop-specific adapter routing, coordinates Web Worker thread lifecycles, and executes local browser cache persistence.
      </p>
      <p>
        <b>3. Intelligence & Machine Learning Layer:</b> Houses the optimized ONNX neural networks for Tomato, Potato, and Chilli. Models are loaded directly into client device memory as singleton sessions utilizing WebAssembly and SIMD vector instructions, achieving sub-200 millisecond execution without cloud communication.
      </p>
    </div>
    '''
    pages.append((26, "14", "Chapter 3. System Design, Methodology and Implementation", p26, False, True))

    # ====================================================
    # PAGE 27 (Arabic 15): Multi-Crop Tri-Model Pipeline
    # ====================================================
    p27 = '''
    <div>
      <h2 class="section-title">3.4 Multi-Model ML Pipeline</h2>
      <p>
        Unlike single-crop research prototypes, the developed system supports three economically vital regional crops, delegating inference to dedicated deep neural architectures tailored to each botanical family. Figure 3.3 illustrates the crop-specific model-routing flowchart, and Table 3.3 details model specifications.
      </p>

      <div class="figure-box" style="margin: 6px 0;">
        <img src="assets/fig3_3_routing.png" alt="Crop-specific model-routing flowchart" style="max-height: 185px;">
      </div>
      <div class="caption-figure"><b>Figure 3.3:</b> Crop-specific model-routing flowchart across Tomato, Potato, and Chilli</div>

      <div class="table-title"><b>Table 3.3:</b> Comparison of the three multi-crop decision-support models</div>
      <table>
        <thead>
          <tr>
            <th style="width: 22%;">Model Identifier</th>
            <th style="width: 18%;">Target Crop</th>
            <th style="width: 20%;">Architecture</th>
            <th style="width: 14%;">Parameters</th>
            <th style="width: 26%;">Supported Classes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>tomato_mobilenetv3_v2</code></td>
            <td>Tomato (<i>Solanum</i>)</td>
            <td>MobileNetV3-Large (SE)</td>
            <td>5.4M (17.1 MB)</td>
            <td>10 (9 pathologies + 1 healthy)</td>
          </tr>
          <tr>
            <td><code>potato_disease</code></td>
            <td>Potato (<i>Solanum</i>)</td>
            <td>Deep Residual CNN</td>
            <td>6.1M (21.8 MB)</td>
            <td>3 (Early Blight, Late Blight, Healthy)</td>
          </tr>
          <tr>
            <td><code>chilli_disease</code></td>
            <td>Chilli (<i>Capsicum</i>)</td>
            <td>Compact Mobile CNN</td>
            <td>2.8M (6.2 MB)</td>
            <td>8 (6 pathologies, deficiency, healthy)</td>
          </tr>
        </tbody>
      </table>

      <p>
        Partitioning the problem space into crop-specific classification models provides distinct agronomic advantages: it prevents visual false positives between disparate crops (e.g., misclassifying tomato early blight as potato leaf curl), reduces individual model parameter sizes, and enables independent updates when regional retraining data becomes available.
      </p>
    </div>
    '''
    pages.append((27, "15", "Chapter 3. System Design, Methodology and Implementation", p27, False, True))

    # ====================================================
    # PAGE 28 (Arabic 16): User Roles & Farmer Module
    # ====================================================
    p28 = '''
    <div>
      <h2 class="section-title">3.5 User Roles and Modules</h2>
      <p>
        The platform defines three functional user roles to support diverse stakeholders across the agricultural value chain: Farmers/Growers, Agricultural Extension Officers, and System Administrators.
      </p>

      <h3 class="subsection-title">3.5.1 Farmer / Grower Module</h3>
      <p>
        Designed specifically for rural usability, the farmer module emphasizes large touch targets, minimal textual overhead, visual feedback, and clear step-by-step guidance. The module requires no user account creation or login credentials to obtain diagnostic results. Table 3.4 outlines the constituent features, and Figure 3.4 displays the end-to-end user workflow.
      </p>

      <div class="table-title"><b>Table 3.4:</b> Farmer module</div>
      <table>
        <thead>
          <tr>
            <th style="width: 24%;">Feature Section</th>
            <th style="width: 76%;">Operational Functionality</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Crop Selection</td>
            <td>Visual card interface displaying high-contrast icons for Tomato, Potato, and Chilli.</td>
          </tr>
          <tr>
            <td>Image Acquisition</td>
            <td>Integrated camera capture trigger or local photo library file picker (JPEG, PNG, WebP).</td>
          </tr>
          <tr>
            <td>Quality Feedback</td>
            <td>Instant client-side warnings if the photo is severely blurred, underexposed, or overexposed.</td>
          </tr>
          <tr>
            <td>Disease Prediction</td>
            <td>Displays classified disease name, botanical pathogen, confidence bar, and risk tier.</td>
          </tr>
          <tr>
            <td>Agronomic Advisory</td>
            <td>Curated cultural practices, sanitation guidance, and organic/chemical treatments.</td>
          </tr>
          <tr>
            <td>Offline Storage</td>
            <td>Caches recent diagnostic assessments locally in browser storage for retrospective review.</td>
          </tr>
        </tbody>
      </table>

      <div class="figure-box" style="margin: 8px 0;">
        <img src="assets/fig3_4_user_workflow.png" alt="Farmer workflow" style="max-height: 160px;">
      </div>
      <div class="caption-figure"><b>Figure 3.4:</b> Farmer workflow</div>
    </div>
    '''
    pages.append((28, "16", "Chapter 3. System Design, Methodology and Implementation", p28, False, True))

    # ====================================================
    # PAGE 29 (Arabic 17): Agronomist, Admin & Dataset Intro
    # ====================================================
    p29 = '''
    <div>
      <h3 class="subsection-title">3.5.2 Agronomist / Extension Officer Module</h3>
      <p>
        Agricultural extension officers require oversight capabilities to review field reports, track regional disease vectors, and validate edge predictions against laboratory findings (Table 3.5).
      </p>

      <div class="table-title"><b>Table 3.5:</b> Agronomist module</div>
      <table>
        <thead>
          <tr>
            <th style="width: 24%;">Function</th>
            <th style="width: 76%;">Clinical & Agronomic Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Diagnostic Review</td>
            <td>Inspection of anomalous or low-confidence edge submissions flagged by growers.</td>
          </tr>
          <tr>
            <td>Advisory Protocol Sync</td>
            <td>Updating recommended chemical fungicides and organic recipes based on regional advisories.</td>
          </tr>
          <tr>
            <td>Outbreak Surveillance</td>
            <td>Aggregating localized disease occurrences to monitor seasonal pest migrations.</td>
          </tr>
        </tbody>
      </table>

      <div class="figure-box" style="margin: 4px 0;">
        <img src="assets/fig3_5_agronomist_workflow.png" alt="Agronomist workflow" style="max-height: 85px;">
      </div>
      <div class="caption-figure"><b>Figure 3.5:</b> Agronomist workflow</div>

      <h3 class="subsection-title">3.5.3 System Administrator Module</h3>
      <div class="table-title"><b>Table 3.6:</b> Admin module</div>
      <table>
        <thead>
          <tr>
            <th style="width: 24%;">Management Area</th>
            <th style="width: 76%;">Administrative Capabilities</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Model Lifecycle</td>
            <td>Deploying updated ONNX weights, configuring execution providers, and version rollback.</td>
          </tr>
          <tr>
            <td>Audit & Telemetry</td>
            <td>Monitoring client-side execution latency, WebAssembly load failures, and error rates.</td>
          </tr>
        </tbody>
      </table>

      <div class="figure-box" style="margin: 4px 0;">
        <img src="assets/fig3_6_admin_workflow.png" alt="Admin workflow" style="max-height: 85px;">
      </div>
      <div class="caption-figure"><b>Figure 3.6:</b> Admin workflow</div>

      <h2 class="section-title">3.6 Dataset and Data Collection</h2>
      <p>
        Supervised training of foliar disease classifiers requires diverse, accurately annotated image corpora. Candidate datasets were audited for taxonomic balance, visual fidelity, and environmental authenticity, as summarized in Section 3.6.1.
      </p>
    </div>
    '''
    pages.append((29, "17", "Chapter 3. System Design, Methodology and Implementation", p29, False, True))

    # ====================================================
    # PAGE 30 (Arabic 18): Dataset Characteristics & Table 3.7
    # ====================================================
    p30 = '''
    <div>
      <p>
        The research utilized a dual-source data foundation: public benchmark repositories for foundational representation learning and curated in-field photographic collections for domain validation. Table 3.7 synthesizes the characteristics of the datasets investigated.
      </p>

      <div class="table-title"><b>Table 3.7:</b> Dataset characteristics and suitability</div>
      <table>
        <thead>
          <tr>
            <th style="width: 18%;">Dataset Source</th>
            <th style="width: 20%;">Crops & Classes</th>
            <th style="width: 14%;">Images</th>
            <th style="width: 20%;">Environment</th>
            <th style="width: 28%;">Suitability & Academic Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>PlantVillage [1]</td>
            <td>Tomato (10), Potato (3), Pepper (2)</td>
            <td>54,306 total (18,160 used)</td>
            <td>Controlled laboratory (uniform grey / black)</td>
            <td>Foundational training; pristine leaf boundaries; establishes baseline feature extraction.</td>
          </tr>
          <tr>
            <td>PlantDoc [4]</td>
            <td>Multi-crop field scenes (13 crops)</td>
            <td>2,598 images (303 tomato)</td>
            <td>Real agricultural fields (complex foliage, soil)</td>
            <td>Field robustness evaluation; tests model resilience against background clutter.</td>
          </tr>
          <tr>
            <td>South Asian Horticultural [7]</td>
            <td>Chilli (8 classes), Bell Pepper</td>
            <td>4,800 images</td>
            <td>Tropical field and open canopy conditions</td>
            <td>Primary training corpus for chilli model; covers cercospora, leaf curl, and anthracnose.</td>
          </tr>
          <tr>
            <td>In-House Photographic Library</td>
            <td>Tomato (10), Potato (3), Chilli (8)</td>
            <td>Curated 21 classes (demonstration & QA)</td>
            <td>Natural sunlight, varied angles, mobile capture</td>
            <td>Independent functional verification; client-side browser testing; user interface validation.</td>
          </tr>
        </tbody>
      </table>

      <p>
        <b>Critical Data Quality Observations:</b> A rigorous audit of laboratory benchmarks revealed that models trained exclusively on PlantVillage learn spurious correlations, such as memorizing the color of the laboratory cardboard rather than pathogenic leaf lesions. To mitigate this vulnerability, transfer learning from ImageNet-1k was augmented with extensive photometric perturbations, geometric rotations, and background synthesis during training.
      </p>
      <p>
        <b>Class Imbalance Considerations:</b> Fungal leaf spot diseases (e.g., tomato early blight) are significantly more prevalent in open datasets than viral vectors (e.g., tomato mosaic virus). Weighted cross-entropy loss functions and stratified train/validation partitioning (80/20 split) were enforced across all training iterations to prevent minority-class collapse.
      </p>
    </div>
    '''
    pages.append((30, "18", "Chapter 3. System Design, Methodology and Implementation", p30, False, True))

    # ====================================================
    # PAGE 31 (Arabic 19): Preprocessing & Table 3.8
    # ====================================================
    p31 = '''
    <div>
      <h2 class="section-title">3.7 Data Preprocessing</h2>
      <p>
        Input images captured by modern mobile phone cameras vary drastically in resolution, aspect ratio, color profile, and exposure. A deterministic client-side preprocessing pipeline standardizes all incoming optical tensors prior to neural inference, as specified in Table 3.8.
      </p>

      <div class="table-title"><b>Table 3.8:</b> Preprocessing operations and tensor transformations</div>
      <table>
        <thead>
          <tr>
            <th style="width: 18%;">Stage</th>
            <th style="width: 24%;">Mathematical Operation</th>
            <th style="width: 28%;">Parameter Specification</th>
            <th style="width: 30%;">Output Tensor State</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Aspect Resize</td>
            <td>Bilinear interpolation</td>
            <td>Scale shortest edge to 224 px</td>
            <td><i>H</i> &times; <i>W</i> &times; 3 (maintains aspect ratio)</td>
          </tr>
          <tr>
            <td>Center Crop</td>
            <td>Crop(<i>H</i><sub>224</sub>, <i>W</i><sub>224</sub>)</td>
            <td>Window size: 224 &times; 224 pixels</td>
            <td>224 &times; 224 &times; 3 (RGB format)</td>
          </tr>
          <tr>
            <td>Pixel Scaling</td>
            <td><i>x</i><sub>norm</sub> = <i>x</i> / 255.0</td>
            <td>Linear mapping [0, 255] &rarr; [0.0, 1.0]</td>
            <td>Float32 precision matrix</td>
          </tr>
          <tr>
            <td>Channel Standardization</td>
            <td><i>z</i><sub><i>c</i></sub> = (<i>x</i><sub><i>c</i></sub> &minus; &mu;<sub><i>c</i></sub>) / &sigma;<sub><i>c</i></sub></td>
            <td>&mu; = [0.485, 0.456, 0.406]<br>&sigma; = [0.229, 0.224, 0.225]</td>
            <td>Zero-mean, unit-variance standardized channels</td>
          </tr>
          <tr>
            <td>Dimension Permute</td>
            <td>Permute(<i>H</i>, <i>W</i>, <i>C</i>) &rarr; (<i>C</i>, <i>H</i>, <i>W</i>)</td>
            <td>Channel-first tensor transposition</td>
            <td>Batch tensor: [1, 3, 224, 224]</td>
          </tr>
        </tbody>
      </table>

      <div class="figure-box" style="margin: 8px 0;">
        <img src="assets/fig3_7_ml_pipeline.png" alt="Deep learning training pipeline" style="max-height: 165px;">
      </div>
      <div class="caption-figure"><b>Figure 3.7:</b> Deep learning training and transfer learning pipeline</div>

      <p>
        The preprocessing sequence is executed identically inside the browser's HTML5 Canvas environment using typed <code>Float32Array</code> structures, ensuring complete numerical parity with the PyTorch Python training pipeline.
      </p>
    </div>
    '''
    pages.append((31, "19", "Chapter 3. System Design, Methodology and Implementation", p31, False, True))

    # ====================================================
    # PAGE 32 (Arabic 20): ML Methodology & Fig 3.9
    # ====================================================
    p32 = '''
    <div>
      <h2 class="section-title">3.8 Machine Learning Methodology</h2>
      <p>
        The classification of plant leaf pathologies is formulated as a supervised multi-class visual recognition task. Let <b>X</b> &sub; <b>R</b><sup>3&times;224&times;224</sup> denote the normalized image space and <b>Y</b> = {1, 2, ..., <i>K</i>} represent the set of discrete pathological categories for a given crop. The goal is to learn a parameterized mapping function <i>f</i><sub>&theta;</sub>: <b>X</b> &rarr; &Delta;<sup><i>K</i>&minus;1</sup> that outputs a probability simplex vector <b>y&#770;</b> = [<i>y&#770;</i><sub>1</sub>, ..., <i>y&#770;</i><sub><i>K</i></sub>]<sup>T</sup>.
      </p>

      <div class="figure-box" style="margin: 6px 0;">
        <img src="assets/fig3_9_preprocessing.png" alt="Image preprocessing and tensor normalization flow" style="max-height: 160px;">
      </div>
      <div class="caption-figure"><b>Figure 3.9:</b> Image preprocessing and tensor normalization flow</div>

      <p>
        <b>Loss Formulation:</b> Neural parameters &theta; are optimized by minimizing the categorical cross-entropy loss with label smoothing (&epsilon; = 0.1) to prevent overconfident boundary decisions on ambiguous foliar lesions:
      </p>
      <div style="text-align: center; margin: 8px 0; font-size: 11pt;">
        <i>L</i><sub>CE</sub>(&theta;) = &minus;&sum;<sub><i>i</i>=1</sub><sup><i>K</i></sup> [ (1 &minus; &epsilon;) <i>y</i><sub><i>i</i></sub> + (&epsilon; / <i>K</i>) ] &middot; ln(<i>f</i><sub>&theta;</sub>(<b>x</b>)<sub><i>i</i></sub>)
      </div>

      <p>
        <b>Optimization Strategy:</b> Training utilizes the AdamW optimizer with decoupled weight decay (&lambda; = 10<sup>&minus;4</sup>), initial learning rate &eta;<sub>0</sub> = 10<sup>&minus;4</sup>, and momentum parameters &beta;<sub>1</sub> = 0.9, &beta;<sub>2</sub> = 0.999. Learning rate decay follows a cosine annealing trajectory with warm restarts:
      </p>
      <div style="text-align: center; margin: 8px 0; font-size: 11pt;">
        &eta;<sub><i>t</i></sub> = &eta;<sub>min</sub> + &frac12;(&eta;<sub>0</sub> &minus; &eta;<sub>min</sub>) [ 1 + cos(&pi;<i>t</i> / <i>T</i><sub>max</sub>) ]
      </div>
      <p>
        This schedule facilitates smooth convergence into broad, flat minima, enhancing out-of-distribution generalization when evaluated on real-world agricultural photographs.
      </p>
    </div>
    '''
    pages.append((32, "20", "Chapter 3. System Design, Methodology and Implementation", p32, False, True))

    # ====================================================
    # PAGE 33 (Arabic 21): Tomato Model & Table 3.9
    # ====================================================
    p33 = '''
    <div>
      <h2 class="section-title">3.9 Multi-Crop Classification Models</h2>
      <p>
        The platform implements three dedicated neural classifiers, each targeting the foliar symptom spectrum of its host crop.
      </p>

      <h3 class="subsection-title">3.9.1 Tomato Disease Classifier (MobileNetV3 V2)</h3>
      <p>
        The tomato diagnostic engine (<code>tomato_mobilenetv3_v2.onnx</code>) is the primary model of the system. It classifies ten distinct foliar categories, comprising nine destructive fungal, bacterial, viral, and acarine pathologies alongside healthy foliage, as documented in Table 3.9.
      </p>

      <div class="table-title"><b>Table 3.9:</b> Tomato foliar disease classes (MobileNetV3 V2)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Idx</th>
            <th style="width: 24%;">Disease Class</th>
            <th style="width: 26%;">Pathogen / Causal Agent</th>
            <th style="width: 42%;">Visual Foliar Pathology</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>0</td><td>Bacterial Spot</td><td><i>Xanthomonas perforans</i></td><td>Small, water-soaked dark spots with yellow halos.</td></tr>
          <tr><td>1</td><td>Early Blight</td><td><i>Alternaria solani</i></td><td>Concentric target-like rings surrounded by chlorotic tissue.</td></tr>
          <tr><td>2</td><td>Late Blight</td><td><i>Phytophthora infestans</i></td><td>Irregular water-soaked greasy lesions; white abaxial mold.</td></tr>
          <tr><td>3</td><td>Leaf Mold</td><td><i>Passalora fulva</i></td><td>Pale green/yellow chlorotic spots turning olive-velvety.</td></tr>
          <tr><td>4</td><td>Septoria Leaf Spot</td><td><i>Septoria lycopersici</i></td><td>Numerous circular spots with tan centers and dark margins.</td></tr>
          <tr><td>5</td><td>Spider Mites</td><td><i>Tetranychus urticae</i></td><td>Fine chlorotic stippling, bronzing, and delicate webbing.</td></tr>
          <tr><td>6</td><td>Target Spot</td><td><i>Corynespora cassiicola</i></td><td>Zonate brown lesions with pinpoint necrotic centers.</td></tr>
          <tr><td>7</td><td>Yellow Leaf Curl</td><td>TYLCV (Begomovirus)</td><td>Severe upward leaf curling, stunted leaflets, chlorosis.</td></tr>
          <tr><td>8</td><td>Mosaic Virus</td><td>ToMV (Tobamovirus)</td><td>Mottled light and dark green mosaic pattern, distortion.</td></tr>
          <tr><td>9</td><td>Healthy Leaf</td><td>None (Pristine)</td><td>Uniform chlorophyll distribution; intact laminar margins.</td></tr>
        </tbody>
      </table>

      <p>
        The model weights total 17.1 MB in ONNX format, operating with an input tensor shape of [1, 3, 224, 224] and generating a 10-dimensional output vector converted to class probabilities via Softmax.
      </p>
    </div>
    '''
    pages.append((33, "21", "Chapter 3. System Design, Methodology and Implementation", p33, False, True))

    # ====================================================
    # PAGE 34 (Arabic 22): Potato & Chilli Models & Quality
    # ====================================================
    p34 = '''
    <div>
      <h3 class="subsection-title">3.9.2 Potato Disease Classifier</h3>
      <p>
        The potato diagnostic module (<code>potato_disease.onnx</code>, 21.8 MB) targets the two primary foliar threats confronting commercial potato cultivation: Early Blight (<i>Alternaria solani</i>) and Late Blight (<i>Phytophthora infestans</i>), alongside healthy potato foliage. Late blight is particularly catastrophic in potato crops, capable of rotting foliage and underground tubers within days. The model architecture leverages deep residual skip connections to preserve high-frequency edge textures essential for identifying fine fungal sporulation margins.
      </p>

      <h3 class="subsection-title">3.9.3 Chilli Disease Classifier</h3>
      <p>
        The chilli disease classification engine (<code>chilli_disease.onnx</code>, 6.2 MB) addresses eight critical agronomic categories: Bacterial Spot (<i>Xanthomonas euvesicatoria</i>), Cercospora Leaf Spot (<i>Cercospora capsici</i>), Chilli Leaf Curl Virus, Powdery Mildew (<i>Leveillula taurica</i>), White Spot / Anthracnose (<i>Colletotrichum capsici</i>), Nutrient Deficiency (chlorotic nitrogen and magnesium starvation), Healthy Foliage, and an 'Others' category for ambiguous symptoms. The model is optimized for rapid execution on entry-level smartphones.
      </p>

      <h2 class="section-title">3.10 Image Quality Inspection and Uncertainty Gating</h2>
      <p>
        A fundamental failure mode in deployed agricultural computer vision is silent misclassification: standard neural networks will gladly assign a 98% confidence score to an unreadable, blurry photograph or a picture of bare soil. To prevent farmer misdirection, the developed platform implements an automated quality inspection and uncertainty gating layer prior to model inference.
      </p>

      <h3 class="subsection-title">3.10.1 Laplacian Blur and Luminance Quality Metric</h3>
      <p>
        Image sharpness is computed on the greyscale image representation <i>I</i>(<i>x,y</i>) using the variance of the 2D Laplacian operator:
      </p>
      <div style="text-align: center; margin: 6px 0; font-size: 11pt;">
        <i>Var</i><sub>Lap</sub> = (1 / <i>HW</i>) &sum;<sub><i>x,y</i></sub> [ &nabla;<sup>2</sup><i>I</i>(<i>x,y</i>) &minus; &mu;<sub>Lap</sub> ]<sup>2</sup>, &nbsp;&nbsp; where &nabla;<sup>2</sup><i>I</i> = &part;<sup>2</sup><i>I</i>/&part;<i>x</i><sup>2</sup> + &part;<sup>2</sup><i>I</i>/&part;<i>y</i><sup>2</sup>
      </div>
      <p>
        If <i>Var</i><sub>Lap</sub> &lt; 100.0, the image is flagged as motion-blurred or out-of-focus. Simultaneously, mean luminance <i>L&#772;</i> = (1 / <i>HW</i>) &sum; (0.299<i>R</i> + 0.587<i>G</i> + 0.114<i>B</i>) is evaluated against boundary thresholds $[40, 220]$ to reject underexposed (too dark) or washed-out overexposed frames.
      </p>
    </div>
    '''
    pages.append((34, "22", "Chapter 3. System Design, Methodology and Implementation", p34, False, True))

    # ====================================================
    # PAGE 35 (Arabic 23): Uncertainty Gating & Table 3.10
    # ====================================================
    p35 = '''
    <div>
      <h3 class="subsection-title">3.10.2 Softmax Entropy and Margin Thresholding</h3>
      <p>
        When an image passes optical quality pre-screening, output uncertainty is quantified via the Shannon entropy of the predicted probability vector <b>y&#770;</b>:
      </p>
      <div style="text-align: center; margin: 6px 0; font-size: 11pt;">
        <i>H</i>(<b>y&#770;</b>) = &minus;&sum;<sub><i>i</i>=1</sub><sup><i>K</i></sup> <i>y&#770;</i><sub><i>i</i></sub> &middot; log<sub>2</sub>(<i>y&#770;</i><sub><i>i</i></sub>)
      </div>
      <p>
        Furthermore, a hard confidence floor is established at <i>p</i><sub>max</sub> = max(<i>y&#770;</i><sub><i>i</i></sub>) &ge; 0.60 (60%). If the peak confidence falls below 60%, or if the prediction margin &Delta;<i>p</i> = <i>y&#770;</i><sub>(1)</sub> &minus; <i>y&#770;</i><sub>(2)</sub> &lt; 0.15, the system triggers an 'Uncertain Diagnosis' advisory warning, explicitly instructing the farmer to inspect the crop again or consult a regional Krishi Bhavan extension officer.
      </p>

      <div class="figure-box" style="margin: 6px 0;">
        <img src="assets/fig3_10_quality_flow.png" alt="Quality inspection and uncertainty gating flow" style="max-height: 165px;">
      </div>
      <div class="caption-figure"><b>Figure 3.10:</b> Quality inspection and uncertainty gating flow</div>

      <div class="table-title"><b>Table 3.10:</b> Image quality thresholds and uncertainty metrics</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Quality Check</th>
            <th style="width: 25%;">Mathematical Metric</th>
            <th style="width: 25%;">Passing Threshold</th>
            <th style="width: 25%;">Triggered Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sharpness Check</td>
            <td>Laplacian Variance &sigma;<sup>2</sup><sub>&nabla;<sup>2</sup></sub></td>
            <td>&ge; 100.0</td>
            <td>Prompt user to hold camera steady and refocus.</td>
          </tr>
          <tr>
            <td>Luminance Bounds</td>
            <td>Mean Luma <i>L&#772;</i> &isin; [0, 255]</td>
            <td>40.0 &le; <i>L&#772;</i> &le; 220.0</td>
            <td>Advise moving into diffuse daylight or avoiding direct flash.</td>
          </tr>
          <tr>
            <td>Confidence Gating</td>
            <td>Peak Softmax max(<i>y&#770;</i><sub><i>i</i></sub>)</td>
            <td>&ge; 0.60 (60%)</td>
            <td>Flag prediction as uncertain; display cautionary banner.</td>
          </tr>
          <tr>
            <td>Ambiguity Margin</td>
            <td>Top-2 Margin <i>y&#770;</i><sub>(1)</sub> &minus; <i>y&#770;</i><sub>(2)</sub></td>
            <td>&ge; 0.15</td>
            <td>Highlight both candidate diseases for physical verification.</td>
          </tr>
        </tbody>
      </table>
    </div>
    '''
    pages.append((35, "23", "Chapter 3. System Design, Methodology and Implementation", p35, False, True))

    # ====================================================
    # PAGE 36 (Arabic 24): Neural Backbones & MobileNetV3
    # ====================================================
    p36 = '''
    <div>
      <h2 class="section-title">3.11 Deep Learning Backbones & Inverted Residual Architecture</h2>
      <h3 class="subsection-title">3.11.1 MobileNetV3 Compound Inverted Residual Blocks</h3>
      <p>
        The primary classification model utilizes the MobileNetV3-Large neural backbone, engineered specifically through hardware-aware Neural Architecture Search (NAS) for efficient mobile processor deployment [2]. The fundamental building block is the Inverted Residual Block with Squeeze-and-Excitation (MBConv-SE), illustrated in Figure 3.12.
      </p>

      <div class="figure-box" style="margin: 6px 0;">
        <img src="assets/fig3_12_mobilenet_block.png" alt="MobileNetV3 inverted residual block" style="max-height: 165px;">
      </div>
      <div class="caption-figure"><b>Figure 3.12:</b> MobileNetV3 inverted residual block with squeeze-and-excitation</div>

      <p>
        The block operation proceeds in four distinct computation steps:
      </p>
      <p>
        <b>1. Pointwise Expansion:</b> A 1 &times; 1 convolution expands input channel dimension <i>C</i><sub>in</sub> by expansion ratio <i>t</i> = 6 into a higher-dimensional feature manifold <i>t</i> &middot; <i>C</i><sub>in</sub>.
      </p>
      <p>
        <b>2. Depthwise Convolution:</b> A 3 &times; 3 or 5 &times; 5 depthwise spatial convolution applies spatial filtering independently per channel, dramatically reducing multiply-accumulate (MAC) operations compared to standard 2D convolutions.
      </p>
      <p>
        <b>3. Squeeze-and-Excitation (SE) Attention:</b> Global average pooling compresses spatial dimensions into a 1 &times; 1 &times; <i>C</i> descriptor, followed by two fully connected layers that compute channel-wise recalibration weights, dynamically emphasizing pathologically informative color bands.
      </p>
      <p>
        <b>4. Linear Bottleneck & Skip Connection:</b> A final 1 &times; 1 projection compresses the channels back to <i>C</i><sub>out</sub> without non-linear activation to preserve manifold geometry. If $C_{\text{in}} = C_{\text{out}}$ and stride is 1, an identity skip connection adds input to output. Non-linearities utilize the computationally efficient Hard-Swish activation: $\text{h-swish}(x) = x \frac{\text{ReLU6}(x+3)}{6}$.
      </p>
    </div>
    '''
    pages.append((36, "24", "Chapter 3. System Design, Methodology and Implementation", p36, False, True))

    # ====================================================
    # PAGE 37 (Arabic 25): Training Hyperparameters & Table 3.11
    # ====================================================
    p37 = '''
    <div>
      <h3 class="subsection-title">3.11.2 Training Configuration and Transfer Learning</h3>
      <p>
        Training deep neural networks from random weight initializations on agricultural datasets leads to severe overfitting. To ensure robust feature representations, models were initialized with weights pre-trained on the 1.28-million image ImageNet-1k corpus, followed by two-stage transfer learning.
      </p>
      <p>
        <b>Stage 1 (Linear Probing):</b> The convolutional backbone weights were frozen, and only the custom classification head was trained for 5 epochs with a learning rate of 10<sup>&minus;3</sup> to adapt to the new class space.
      </p>
      <p>
        <b>Stage 2 (Full Fine-Tuning):</b> All backbone layers were unfrozen and trained end-to-end for 20 epochs with a reduced learning rate of 10<sup>&minus;4</sup> governed by cosine annealing. Extensive data augmentations were applied, including random rotations (&plusmn;25&deg;), horizontal/vertical flips, affine perspective shifts, and color jitter (brightness &plusmn;20%, contrast &plusmn;20%). Table 3.11 details training hyperparameters.
      </p>

      <div class="table-title"><b>Table 3.11:</b> MobileNetV3 training and transfer learning hyperparameters</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Hyperparameter</th>
            <th style="width: 25%;">Empirical Value</th>
            <th style="width: 50%;">Architectural Rationale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Base Architecture</td>
            <td>MobileNetV3-Large</td>
            <td>Optimal balance of depthwise SE attention and low MAC count.</td>
          </tr>
          <tr>
            <td>Input Resolution</td>
            <td>224 &times; 224 &times; 3</td>
            <td>Standard receptive field capturing microscopic foliar lesions.</td>
          </tr>
          <tr>
            <td>Classifier Head</td>
            <td>Dropout(0.2) $\rightarrow$ Linear(960 &rarr; 10)</td>
            <td>Prevents co-adaptation of features in final dense layer.</td>
          </tr>
          <tr>
            <td>Loss Function</td>
            <td>Smooth Cross-Entropy (&epsilon; = 0.1)</td>
            <td>Prevents probability over-saturation on ambiguous field samples.</td>
          </tr>
          <tr>
            <td>Optimizer</td>
            <td>AdamW (&beta;<sub>1</sub> = 0.9, &beta;<sub>2</sub> = 0.999)</td>
            <td>Decoupled weight decay eliminates <i>L</i><sub>2</sub> regularization bias.</td>
          </tr>
          <tr>
            <td>Weight Decay</td>
            <td>1 &times; 10<sup>&minus;4</sup></td>
            <td>Constrains parameter magnitudes against small dataset sizes.</td>
          </tr>
          <tr>
            <td>Batch Size</td>
            <td>32</td>
            <td>Maintains stochastic gradient noise for escaping sharp local minima.</td>
          </tr>
          <tr>
            <td>Training Epochs</td>
            <td>25 total (5 freeze + 20 full)</td>
            <td>Early stopping with patience of 5 epochs on validation loss.</td>
          </tr>
        </tbody>
      </table>
    </div>
    '''
    pages.append((37, "25", "Chapter 3. System Design, Methodology and Implementation", p37, False, True))

    # ====================================================
    # PAGE 38 (Arabic 26): Backend Architecture & Table 3.12
    # ====================================================
    p38 = '''
    <div>
      <h2 class="section-title">3.12 Backend Architecture</h2>
      <p>
        While edge-native client execution is the primary inference pathway, the platform integrates lightweight serverless API microservices built with Python and FastAPI / Flask to support legacy browser fallback, batch validation, and agronomic knowledge retrieval. Figure 3.13 illustrates the service orchestration.
      </p>

      <div class="figure-box" style="margin: 6px 0;">
        <img src="assets/fig3_13_backend.png" alt="Backend architecture" style="max-height: 165px;">
      </div>
      <div class="caption-figure"><b>Figure 3.13:</b> Backend architecture and service orchestration</div>

      <h3 class="subsection-title">3.12.1 REST API Endpoints and Serverless Handlers</h3>
      <p>
        The backend exposes modular RESTful endpoints conforming to OpenAPI specifications, summarized in Table 3.12.
      </p>

      <div class="table-title"><b>Table 3.12:</b> Application REST API endpoints and serverless routes</div>
      <table>
        <thead>
          <tr>
            <th style="width: 14%;">Method</th>
            <th style="width: 26%;">Endpoint Route</th>
            <th style="width: 38%;">Functional Purpose</th>
            <th style="width: 22%;">Auth / Role</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>POST</td><td><code>/predict</code></td><td>Server-side fallback leaf classification for low-tier clients.</td><td>Public / Anonymous</td></tr>
          <tr><td>GET</td><td><code>/api/crops</code></td><td>Retrieves supported crop metadata and model status flags.</td><td>Public</td></tr>
          <tr><td>GET</td><td><code>/api/advisory/:crop/:id</code></td><td>Returns localized cultural, organic, and chemical guidelines.</td><td>Public</td></tr>
          <tr><td>POST</td><td><code>/api/feedback</code></td><td>Submits farmer diagnostic validation or field misclassification.</td><td>Public</td></tr>
          <tr><td>POST</td><td><code>/api/admin/login</code></td><td>Authenticates agronomy extension officers and administrators.</td><td>Bearer Token</td></tr>
          <tr><td>GET</td><td><code>/api/admin/telemetry</code></td><td>Retrieves inference latency, error rates, and quality stats.</td><td>Admin Role</td></tr>
        </tbody>
      </table>
    </div>
    '''
    pages.append((38, "26", "Chapter 3. System Design, Methodology and Implementation", p38, False, True))

    # ====================================================
    # PAGE 39 (Arabic 27): Frontend & Database Design
    # ====================================================
    p39 = '''
    <div>
      <h2 class="section-title">3.13 Frontend Implementation</h2>
      <p>
        The user interface is engineered with Next.js 16 (App Router), React 19, and TypeScript. A major design priority was ensuring zero UI thread stuttering during heavy tensor operations. To achieve this, all neural inference and bilinear image resizing operations are offloaded to dedicated background <b>HTML5 Web Workers</b> via <code>comlink</code> messaging channels. The main UI thread remains completely responsive at 60 frames per second, providing fluid animations, camera framing guides, and instantaneous touch feedback.
      </p>
      <p>
        <b>PWA Offline Caching:</b> The application incorporates a Service Worker utilizing the Cache-First strategy for static assets and ONNX model binary weights. Once the user visits the website, all three neural networks are permanently stored in the browser's Cache Storage. Subsequent diagnostic sessions operate completely disconnected from the Internet.
      </p>

      <h2 class="section-title">3.14 Database Design</h2>
      <p>
        The persistence architecture accommodates both local offline storage on the farmer's device and synchronized cloud records for extension reporting. Figure 3.14 shows the conceptual Entity-Relationship (ER) diagram.
      </p>

      <div class="figure-box" style="margin: 6px 0;">
        <img src="assets/fig3_14_database_er.png" alt="Database ER diagram" style="max-height: 180px;">
      </div>
      <div class="caption-figure"><b>Figure 3.14:</b> Database / ER diagram (conceptual)</div>
    </div>
    '''
    pages.append((39, "27", "Chapter 3. System Design, Methodology and Implementation", p39, False, True))

    # ====================================================
    # PAGE 40 (Arabic 28): Database Entities & Security
    # ====================================================
    p40 = '''
    <div>
      <p>
        The conceptual schema models six primary operational entities supporting the diagnostic and agronomic advisory pipeline, as defined in Table 3.13.
      </p>

      <div class="table-title"><b>Table 3.13:</b> Conceptual database entities</div>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Entity Name</th>
            <th style="width: 80%;">Attribute Description & Relationship</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>CropRegistry</code></td>
            <td><code>crop_id</code> (PK), <code>common_name</code>, <code>botanical_name</code>, <code>model_file</code>, <code>class_count</code>, <code>is_active</code>. Defines supported botanical categories.</td>
          </tr>
          <tr>
            <td><code>DiseaseClass</code></td>
            <td><code>disease_id</code> (PK), <code>crop_id</code> (FK), <code>class_index</code>, <code>disease_name</code>, <code>pathogen</code>, <code>severity_tier</code>. Maps model output indices to pathological diagnoses.</td>
          </tr>
          <tr>
            <td><code>AgronomicAdvisory</code></td>
            <td><code>advisory_id</code> (PK), <code>disease_id</code> (FK), <code>cultural_control</code>, <code>organic_remedy</code>, <code>chemical_spray</code>, <code>prevention</code>. Authoritative treatment instructions.</td>
          </tr>
          <tr>
            <td><code>DiagnosticRecord</code></td>
            <td><code>record_id</code> (PK), <code>crop_id</code>, <code>predicted_class</code>, <code>confidence</code>, <code>quality_score</code>, <code>timestamp</code>, <code>is_uncertain</code>. Local and synced diagnostic event logs.</td>
          </tr>
          <tr>
            <td><code>QualityTelemetry</code></td>
            <td><code>telemetry_id</code> (PK), <code>laplacian_var</code>, <code>mean_luma</code>, <code>inference_latency_ms</code>, <code>device_tier</code>. Anonymous performance metrics.</td>
          </tr>
          <tr>
            <td><code>AuditTrail</code></td>
            <td><code>log_id</code> (PK), <code>admin_user</code>, <code>action_type</code>, <code>model_version</code>, <code>timestamp</code>. Tamper-evident record of administrative model updates.</td>
          </tr>
        </tbody>
      </table>

      <h3 class="subsection-title">3.14.1 Dual Persistence and Cloud Integration</h3>
      <p>
        A dual-persistence strategy bridges offline operation and cloud synchronization. Client devices store diagnostic history in browser <b>IndexedDB</b> via a local Dexie.js wrapper. When cellular data becomes available, the client opportunistically synchronizes aggregated statistical records (excluding raw image pixels) to Google Cloud Firestore, enabling regional agricultural monitoring.
      </p>

      <h2 class="section-title">3.15 Security, Data Handling, and Role-Based Access</h2>
      <p>
        Agricultural data systems require strict adherence to privacy and integrity standards. <b>Client-Side Privacy:</b> By executing inference locally in WebAssembly, photographic images never leave the farmer's device. No personal identifiable information (PII) such as farmer name, mobile number, or GPS coordinates is harvested. <b>API Authentication:</b> Administrative endpoints require cryptographically signed JSON Web Tokens (JWT) using salted scrypt password hashing.
      </p>
    </div>
    '''
    pages.append((40, "28", "Chapter 3. System Design, Methodology and Implementation", p40, False, True))

    # ====================================================
    # PAGE 41 (Arabic 29): Complete System Workflow & Fig 3.15
    # ====================================================
    p41 = '''
    <div>
      <h2 class="section-title">3.16 System Workflow</h2>
      <p>
        The complete interaction cycle of the proposed platform unites the multi-crop routing, image quality inspection, client-side neural inference, and agronomic advisory engines into a seamless user journey, illustrated in Figure 3.15.
      </p>

      <div class="figure-box" style="margin: 6px 0;">
        <img src="assets/fig3_15_system_workflow.png" alt="Complete system workflow" style="max-height: 195px;">
      </div>
      <div class="caption-figure"><b>Figure 3.15:</b> Complete system workflow</div>

      <p>
        <b>Step-by-Step Operational Progression:</b>
      </p>
      <p>
        1. <b>Access & Crop Selection:</b> The farmer opens the web application and selects the target crop from the visual selector cards (Tomato, Potato, or Chilli).
      </p>
      <p>
        2. <b>Image Acquisition:</b> The farmer takes a photograph of a single symptomatic leaf using the device camera or selects an existing photo from storage.
      </p>
      <p>
        3. <b>Quality Pre-screening:</b> The client-side worker calculates Laplacian variance and mean luminance. If blur or exposure faults occur, corrective guidance is displayed immediately.
      </p>
      <p>
        4. <b>Tensor Transformation:</b> The image is cropped to $224 \times 224$, normalized using ImageNet channel statistics, and converted to an ONNX tensor.
      </p>
      <p>
        5. <b>Neural Inference:</b> The crop-specific ONNX model executes via WebAssembly, outputting class logits in 110–180 milliseconds.
      </p>
      <p>
        6. <b>Uncertainty Gating & Advisory Presentation:</b> Softmax probabilities are checked against the 60% confidence floor. The interface presents the disease diagnosis, confidence meter, and actionable cultural, biological, and chemical treatment recommendations.
      </p>
    </div>
    '''
    pages.append((41, "29", "Chapter 3. System Design, Methodology and Implementation", p41, False, True))

    return pages

print("Chapter 3 module compiled successfully.")
