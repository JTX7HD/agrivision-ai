"""
Chapters 1 & 2 (Pages 13-23 / Arabic 1-11) for B.Tech Project Report.
"""

def get_chapter1_and_chapter2_pages():
    pages = []

    # ====================================================
    # CHAPTER 1: INTRODUCTION (Pages 13-16 / Arabic 1-4)
    # ====================================================

    # PAGE 13 (Page 1)
    p13 = '''
    <div>
      <div class="chapter-number">CHAPTER 1</div>
      <h1 class="chapter-title" style="margin-top: 6px; margin-bottom: 20px;">INTRODUCTION</h1>

      <h2 class="section-title">1.1 Overview</h2>
      <p>
        Foliar plant diseases represent one of the most critical threats to global agricultural stability, reducing annual crop production by an estimated 20% to 40% across major commercial food staples worldwide [1]. In developing and emerging agrarian economies, smallholder farming operations sustain rural livelihoods and supply the majority of domestic produce. However, these agricultural ecosystems face persistent vulnerability to pathogenic infections caused by fungal spores, bacterial blights, and viral vectors.
      </p>
      <p>
        Horticultural crops such as Tomato (<i>Solanum lycopersicum</i>), Potato (<i>Solanum tuberosum</i>), and Chilli Pepper (<i>Capsicum annuum</i>) are economically indispensable yet physiologically susceptible to rapid disease progression. When pathogen outbreaks occur, early visual symptoms frequently manifest as localized foliar lesions, chlorotic halos, or structural leaf curling. For example, early blight caused by <i>Alternaria solani</i> produces concentric circular target-like spots, while late blight caused by the oomycete <i>Phytophthora infestans</i> initiates dark, water-soaked foliar necrosis that can destroy entire acreage within seven to ten days under cool, humid weather conditions [1].
      </p>
      <p>
        Traditional disease identification relies almost exclusively on manual physical inspection by experienced agricultural extension officers or destructive laboratory assays. In typical agricultural belts, extension officers must serve thousands of farming households spread across vast geographic territories, resulting in critical diagnostic delays of several weeks. By the time a definitive diagnosis is confirmed, fungal or viral pathogens have frequently spread to neighboring fields.
      </p>
      <p>
        Furthermore, visual diagnosis in the field is complicated by extensive visual mimicry: different pathogens often produce overlapping early-stage necrotic spots, while distinct diseases may exhibit similar chlorosis patterns. Under-resourced farmers frequently respond with broad-spectrum prophylactic chemical spraying. This indiscriminate application of chemical fungicides not only increases input costs and erodes operating margins, but also induces environmental chemical runoff, pollutes rural groundwater tables, and accelerates pathogen resistance.
      </p>
    </div>
    '''
    pages.append((13, "1", "Chapter 1. Introduction", p13, False, True))

    # PAGE 14 (Page 2)
    p14 = '''
    <div>
      <p>
        Recent advancements in mobile computing and deep convolutional neural networks (CNNs) have created unprecedented opportunities to bring automated, instantaneous plant pathology recognition directly to the agricultural field [2, 4]. By capturing a standard digital photograph of a symptomatic leaf using an everyday smartphone camera, farmers can potentially receive immediate diagnostic feedback. Figure 1.1 illustrates the conceptual paradigm pursued in this project.
      </p>

      <div class="figure-box">
        <img src="assets/fig1_1_concept.png" alt="Multi-crop decision-support concept">
      </div>
      <div class="caption-figure"><b>Figure 1.1:</b> Multi-crop agricultural decision-support concept</div>

      <p>
        This project investigates and develops an end-to-end, edge-deployable, multi-crop plant leaf disease classification and farmer advisory platform. The system integrates three dedicated deep neural network architectures optimized for the specific foliar pathology of Tomato, Potato, and Chilli, coupled with an automated image-quality inspection pipeline and an evidence-based agronomic advisory knowledge base.
      </p>

      <h2 class="section-title">1.2 Motivation and Objective</h2>
      <p>
        Despite the rapid proliferation of computer vision research in precision agriculture, existing diagnostic approaches present critical limitations that prevent effective frontline adoption. First, the vast majority of existing academic models are trained and evaluated strictly on clean laboratory benchmarks such as PlantVillage [1], where leaves are photographed against uniform, monochromatic backgrounds under controlled illumination. When deployed in real agricultural fields, these models suffer severe performance degradation—termed the laboratory-to-field domain gap—due to dynamic natural lighting, soil clutter, and leaf occlusions [4, 7].
      </p>
      <p>
        Second, existing agricultural tools typically require continuous cloud connectivity, transmitting heavy uncompressed images to distant server clusters. In rural farming regions where cellular connectivity is intermittent, slow, or expensive, cloud-tethered architectures fail to deliver reliable diagnostics. Third, standard deep learning classifiers produce raw softmax probability distributions that are notoriously overconfident, assigning high certainty scores to out-of-domain weeds or unreadable blurry images.
      </p>
    </div>
    '''
    pages.append((14, "2", "Chapter 1. Introduction", p14, False, True))

    # PAGE 15 (Page 3)
    p15 = '''
    <div>
      <p>
        Addressing these practical barriers requires an integrated, multi-crop architectural platform that executes directly within the client device's browser, validates photographic quality before neural inference, calibrates predictive uncertainty, and translates raw categorical labels into actionable agricultural treatments.
      </p>

      <p>
        The specific technical objectives of this project are:
      </p>
      <ol class="academic-list">
        <li><b>Dataset Curation and Audit:</b> To assemble, standardize, and audit a comprehensive multi-crop leaf image dataset covering 21 supported disease and healthy foliage classes across Tomato, Potato, and Chilli crops.</li>
        <li><b>Lightweight Model Architecture:</b> To explore, fine-tune, and deploy parameter-efficient convolutional neural network backbones (MobileNetV3 V2) optimized for low-latency inference on resource-constrained mobile hardware.</li>
        <li><b>Isolated Multi-Crop Routing:</b> To design an isolated crop-routing mechanism that dispatches leaf imagery strictly to dedicated, crop-specific classification models, prohibiting erroneous cross-species evaluations.</li>
        <li><b>Image Preprocessing Pipeline:</b> To implement an automated client-side preprocessing pipeline including bilinear resizing to 224 × 224 pixels, RGB color normalization, and ImageNet z-score tensor standardization.</li>
        <li><b>Automated Image Quality Inspection:</b> To develop an algorithmic quality verification engine utilizing Laplacian variance blur detection and luminance analysis to reject unsuitable field photos prior to classification.</li>
        <li><b>Uncertainty Gating and Rejection:</b> To establish a calibrated confidence thresholding mechanism (60% certainty gating) and out-of-domain detection to flag borderline or ambiguous symptoms transparently.</li>
        <li><b>Edge-Native WebAssembly Inference:</b> To integrate ONNX Runtime WebAssembly (WASM) to execute deep learning models completely client-side in the browser, achieving sub-second latency without mandatory data uploads.</li>
        <li><b>Farmer Advisory Engine:</b> To construct an evidence-based agricultural knowledge base providing tailored symptom descriptions, preventative measures, organic cultural controls, and chemical treatments for all 21 classes.</li>
        <li><b>Dual Persistence & Service Architecture:</b> To establish a robust software engineering architecture featuring local persistent JSON storage, cloud synchronization capabilities, and a RESTful API service layer.</li>
        <li><b>Empirical Performance Evaluation:</b> To conduct comprehensive functional and empirical testing, documenting per-class accuracy, precision, recall, F1-score, latency, and laboratory-to-field domain shifts.</li>
      </ol>
    </div>
    '''
    pages.append((15, "3", "Chapter 1. Introduction", p15, False, True))

    # PAGE 16 (Page 4)
    p16 = '''
    <div>
      <h2 class="section-title">1.3 Report Organization</h2>
      <p>
        The remainder of this report is structured as follows. <b>Chapter 2</b> presents a comprehensive literature survey examining recent advances in deep learning for plant pathology, mobile edge vision backbones, agricultural datasets, the laboratory-to-field domain gap, and explainable AI in agriculture, concluding with a precise summary of identified research gaps.
      </p>
      <p>
        <b>Chapter 3</b> details the system design, methodology, and implementation. It presents the requirement analysis, overall multi-tier architecture, multi-crop model routing, dataset curation, image preprocessing sequence, deep learning model specifications, image quality inspection, backend services, frontend user interface, database design, and end-to-end system workflow.
      </p>
      <p>
        <b>Chapter 4</b> reports the experimental results and empirical discussion. It documents the current system status, multi-crop model classification performance, confusion matrices, ROC curves, image quality validation checks, integration test matrices, comparative literature benchmarks, and identified limitations.
      </p>
      <p>
        <b>Chapter 5</b> concludes the report with a synthesis of verified technical contributions and outlines concrete directions for future research, including expanded crop models, multilingual voice advisory, and domain adaptation pipelines. The report concludes with academic references and technical appendices.
      </p>

      <h2 class="section-title">1.4 Scope and Status of This Work</h2>
      <p>
        To ensure complete scientific and academic integrity, the precise boundaries of this project are explicitly defined. The operational platform currently supports three specific commercial horticultural crops: Tomato (10 classes), Potato (3 classes), and Chilli Pepper (8 classes), comprising 21 distinct classification categories. Additional crops (such as Maize, Rice, and Banana) are recognized as planned roadmap items and are explicitly tagged as <i>"Coming Soon"</i> within the system interface.
      </p>
      <p>
        Model execution is achieved via optimized ONNX Runtime WebAssembly running directly inside modern web browsers on consumer hardware, supplemented by a local REST API gateway. The system functions strictly as an educational and decision-support tool; it does not replace certified phytosanitary diagnostic laboratories or professional agricultural extension services. All empirical metrics and classification accuracies reported in Chapter 4 are derived from documented evaluation scripts operating on verified validation datasets and real photographic test libraries.
      </p>
    </div>
    '''
    pages.append((16, "4", "Chapter 1. Introduction", p16, False, True))

    # ====================================================
    # CHAPTER 2: LITERATURE SURVEY (Pages 17-23 / Arabic 5-11)
    # ====================================================

    # PAGE 17 (Page 5)
    p17 = '''
    <div>
      <div class="chapter-number">CHAPTER 2</div>
      <h1 class="chapter-title" style="margin-top: 6px; margin-bottom: 20px;">LITERATURE SURVEY</h1>

      <p>
        This chapter provides a critical review of published research relevant to machine learning in plant pathology. The reviewed literature is organized into five thematic domains: deep learning for plant disease classification (Section 2.1), mobile edge vision architectures (Section 2.2), foliar object detection (Section 2.3), public agricultural datasets and domain shifts (Section 2.4), and explainability and calibration (Section 2.5). Figure 2.1 illustrates this thematic taxonomy.
      </p>

      <div class="figure-box">
        <img src="assets/fig2_1_literature.png" alt="Classification of reviewed literature">
      </div>
      <div class="caption-figure"><b>Figure 2.1:</b> Classification of the reviewed literature</div>

      <h2 class="section-title">2.1 Deep Learning for Plant Pathology</h2>
      <h3 class="subsection-title">2.1.1 Foundational CNN Architectures on Benchmark Datasets</h3>
      <p>
        <b>Introduction:</b> The seminal investigation by Mohanty, Hughes, and Salathé [1] (<i>Frontiers in Plant Science</i>, 2016) demonstrated the transformative potential of deep convolutional neural networks for automated plant disease diagnosis. The authors evaluated standard architectures on the open-access PlantVillage repository.
      </p>
      <p>
        <b>Approach:</b> The authors implemented AlexNet and GoogLeNet backbones, comparing performance when trained from scratch against transfer learning from ImageNet-pretrained weights across color, grayscale, and segmented leaf representations.
      </p>
      <p>
        <b>Dataset and Setup:</b> The study evaluated 54,306 images spanning 14 crop species and 26 diseases. A standard 80–20 train-test split was applied, with stochastic gradient descent optimization.
      </p>
      <p>
        <b>Results:</b> The fine-tuned GoogLeNet model achieved an overall classification accuracy of 99.35% on held-out test data. However, when tested on leaf photographs collected independently from online sources outside PlantVillage, accuracy plummeted below 31%.
      </p>
      <p>
        <b>Conclusion and Limitations:</b> The authors concluded that deep learning achieves outstanding classification under controlled conditions, but cautioned that models learn background correlations rather than pure foliar pathology, necessitating real-world field evaluations.
      </p>
    </div>
    '''
    pages.append((17, "5", "Chapter 2. Literature Survey", p17, False, True))

    # PAGE 18 (Page 6)
    p18 = '''
    <div>
      <h3 class="subsection-title">2.1.2 Deep Residual Learning and Multi-Scale Extraction</h3>
      <p>
        <b>Introduction:</b> Too et al. [2] (<i>PeerJ Computer Science</i>, 2019) conducted a comparative architectural evaluation across advanced convolutional networks, including VGG-16, Inception-V4, ResNet-50, ResNet-101, and DenseNet-121, for crop pathology identification.
      </p>
      <p>
        <b>Approach:</b> The authors investigated gradient flow and feature reuse in deep residual networks, evaluating how identity mappings and dense feature concatenations mitigate vanishing gradients during fine-tuning on fine-grained foliar lesions.
      </p>
      <p>
        <b>Dataset and Setup:</b> Experiments utilized 54,305 PlantVillage leaf images covering 38 distinct crop-disease classes under standardized laboratory settings.
      </p>
      <p>
        <b>Results:</b> DenseNet-121 achieved the highest top-1 classification accuracy of 99.75%, closely followed by ResNet-50 at 99.53%. DenseNet exhibited superior parameter efficiency compared to VGG-16 while demonstrating faster epoch convergence.
      </p>
      <p>
        <b>Conclusion and Limitations:</b> Modern residual and densely connected backbones provide superior feature extraction for fine foliar spots. However, the models remained computationally heavy (>80 MB weight footprints), restricting their deployment on edge smartphones without quantization.
      </p>

      <h3 class="subsection-title">2.1.3 Transfer Learning from General-Domain Ensembles</h3>
      <p>
        <b>Introduction:</b> Ferentinos [3] (<i>Computers and Electronics in Agriculture</i>, 2018) investigated deep learning convolutional neural network models for plant disease detection using an extensive multi-crop database of healthy and diseased leaves.
      </p>
      <p>
        <b>Approach:</b> Five prominent architectures (VGG, VGG-CNN-S, VGG-CNN-M, VGG-CNN-F, and AlexNet) were evaluated with diverse transfer learning protocols. The study examined the impact of laboratory versus field imagery.
      </p>
      <p>
        <b>Dataset and Setup:</b> A composite database of 87,848 images covering 58 distinct classes across 25 crop species was compiled.
      </p>
      <p>
        <b>Results:</b> The VGG architecture achieved 99.53% operational classification accuracy on the combined test set. The author demonstrated that training on mixed datasets substantially improved model robustness compared to training strictly on isolated laboratory imagery.
      </p>
      <p>
        <b>Conclusion and Limitations:</b> Combining diverse training data enhances generalization. However, high computational latency and memory consumption remained significant hurdles for frontline mobile adoption.
      </p>
    </div>
    '''
    pages.append((18, "6", "Chapter 2. Literature Survey", p18, False, True))

    # PAGE 19 (Page 7)
    p19 = '''
    <div>
      <h2 class="section-title">2.2 Mobile Edge Vision Architectures</h2>
      <h3 class="subsection-title">2.2.1 Depthwise Separable Convolutions & MobileNet Backbones</h3>
      <p>
        <b>Introduction:</b> Howard et al. [4] (<i>IEEE ICCV</i>, 2019) introduced MobileNetV3, combining hardware-aware neural architecture search (NAS), NetAdapt algorithms, and architectural novelties for efficient mobile computer vision.
      </p>
      <p>
        <b>Approach:</b> MobileNetV3 employs depthwise separable convolutions that factorize standard convolution into a depthwise spatial filter and a 1 × 1 pointwise convolution. The architecture integrates linear bottleneck inverted residuals, Squeeze-and-Excitation (SE) channel attention modules, and the computationally efficient Hard-Swish non-linear activation function:
      </p>
      <div class="equation-box">
        Hard-Swish(x) = x · [ ReLU6(x + 3) / 6 ]
        <span class="equation-number">(2.1)</span>
      </div>
      <p>
        <b>Results:</b> MobileNetV3 Large demonstrated a 3.2% accuracy improvement on ImageNet while reducing latency by 20% compared to MobileNetV2 on mobile CPU runtimes.
      </p>
      <p>
        <b>Relevance:</b> MobileNetV3 provides the ideal architectural foundation for edge plant disease classification, offering rich representational capacity within a sub-20 MB parameter footprint.
      </p>

      <h3 class="subsection-title">2.2.2 Hard-Swish and Channel Attention Mechanisms</h3>
      <p>
        <b>Introduction:</b> Hu, Shen, and Sun [5] (<i>IEEE CVPR</i>, 2018) introduced Squeeze-and-Excitation networks, demonstrating that explicitly modeling channel-wise feature interdependencies significantly boosts representational power.
      </p>
      <p>
        <b>Approach:</b> A global average pooling operation compresses spatial dimensions into a channel descriptor (squeeze), followed by two fully connected layers with a sigmoid gating mechanism (excitation) that scales feature channels dynamically based on diagnostic relevance.
      </p>
      <p>
        <b>Relevance to Plant Pathology:</b> In foliar disease diagnosis, channel attention enables the neural network to suppress irrelevant green background pixels while dynamically amplifying chromatic channels corresponding to chlorotic halos, necrotic brown lesions, and powdery white spores.
      </p>
    </div>
    '''
    pages.append((19, "7", "Chapter 2. Literature Survey", p19, False, True))

    # PAGE 20 (Page 8)
    p20 = '''
    <div>
      <h2 class="section-title">2.3 Foliar Object Detection and Leaf ROI Extraction</h2>
      <h3 class="subsection-title">2.3.1 YOLO Single-Shot Detectors for Complex Field Scenes</h3>
      <p>
        <b>Introduction:</b> Jocher et al. [6] (2024) developed the YOLO11 architecture, offering state-of-the-art real-time object detection through an enhanced backbone with C3k2 modules, Spatial Pyramid Pooling Fast (SPPF), and optimized anchor-free detection heads.
      </p>
      <p>
        <b>Approach:</b> Rather than classifying full, uncurated field scenes containing extraneous soil and weeds, single-shot detectors predict spatial bounding box coordinates `(x, y, w, h)` to isolate individual leaf regions of interest (ROI).
      </p>
      <p>
        <b>Relevance:</b> In agricultural environments, foliage is frequently surrounded by background clutter. Deploying a lightweight leaf detector (such as YOLO11n) ensures that downstream classification models focus exclusively on the biological leaf surface, filtering out background noise.
      </p>

      <h2 class="section-title">2.4 Agricultural Benchmarks & Laboratory-to-Field Gap</h2>
      <h3 class="subsection-title">2.4.1 Controlled Laboratory Datasets: PlantVillage</h3>
      <p>
        <b>Overview:</b> PlantVillage [1] is the most widely utilized benchmark in agricultural computer vision, providing over 54,000 leaf photographs depicting 38 crop-disease categories. While invaluable for algorithm benchmarking, its uniform, monochromatic laboratory backdrops fail to represent natural farm conditions.
      </p>

      <h3 class="subsection-title">2.4.2 In-Field Open Benchmark Studies: PlantDoc</h3>
      <p>
        <b>Introduction:</b> Singh, Jain, and Jain [7] (<i>ACM COMPASS</i>, 2020) presented PlantDoc, an open-source dataset designed specifically to address the laboratory-to-field domain shift.
      </p>
      <p>
        <b>Approach and Dataset:</b> The authors curated 2,598 in-field leaf images across 13 plant species and 27 categories, characterized by diverse natural illumination, overlapping leaves, and complex agricultural backgrounds.
      </p>
      <p>
        <b>Results:</b> Models trained purely on PlantVillage suffered a 31% to 52% absolute accuracy collapse when evaluated directly on PlantDoc field images. Incorporating in-field training imagery restored accuracy by up to 34%.
      </p>
      <p>
        <b>Conclusion:</b> Controlled benchmarks produce brittle classifiers. Realistic agricultural decision-support systems must evaluate in-field datasets and implement robust preprocessing safeguards.
      </p>
    </div>
    '''
    pages.append((20, "8", "Chapter 2. Literature Survey", p20, False, True))

    # PAGE 21 (Page 9)
    p21 = '''
    <div>
      <h3 class="subsection-title">2.4.3 Mendeley and South Asian Horticultural Datasets</h3>
      <p>
        <b>Introduction:</b> Reza, Khaan et al. [8] (<i>EACL</i>, 2026) introduced KrishokTech, providing extensive open-access foliar pathology datasets and multi-modal models tailored to smallholder farming in South Asia, including Chilli Pepper and Potato crops.
      </p>
      <p>
        <b>Dataset Characteristics:</b> The dataset provides thousands of real-world field photographs covering critical regional pathologies including Chilli Bacterial Spot, Cercospora Leaf Spot, Yellow Leaf Curl, and Nutritional Deficiencies. Crucially, the dataset introduces an explicit <i>Others</i> category for non-crop foliage rejection.
      </p>
      <p>
        <b>Relevance:</b> This project incorporates model weights and class definitions derived from KrishokTech and Mendeley repositories under Apache 2.0 licensing to power dedicated Chilli and Potato classification pipelines.
      </p>

      <h3 class="subsection-title">2.4.4 Domain Adaptation and Generalization Challenges</h3>
      <p>
        <b>Analysis:</b> Research by Barbedo [9] demonstrates that environmental domain shifts—arising from variations in solar angle, leaf wetness, soil hue, and shadow casting—substantially alter the low-level spatial frequencies captured by camera sensors. Without domain adaptation or input quality verification, deep learning models frequently latch onto non-pathological background artifacts.
      </p>

      <h2 class="section-title">2.5 Explainability and Confidence Calibration in Agronomic AI</h2>
      <p>
        <b>Explainability:</b> Ribeiro, Singh, and Guestrin [10] (<i>ACM SIGKDD</i>, 2016) introduced LIME (Local Interpretable Model-agnostic Explanations), which perturbs input superpixels to generate visual saliency heatmaps. In agronomic applications, visual explainability enables farmers to verify that predictions are driven by actual necrotic lesions rather than irrelevant stem shadows.
      </p>
      <p>
        <b>Confidence Calibration:</b> Guo et al. [11] (<i>ICML</i>, 2017) demonstrated that modern deep neural networks with batch normalization and residual links are poorly calibrated, producing overconfident misclassifications. In agricultural decision support, uncalibrated confidence can lead farmers to apply costly and inappropriate chemical treatments. Applying probability thresholding (e.g., gating classifications below 60% confidence) provides an essential safety buffer.
      </p>
    </div>
    '''
    pages.append((21, "9", "Chapter 2. Literature Survey", p21, False, True))

    # PAGE 22 (Page 10)
    p22 = '''
    <div>
      <h2 class="section-title">2.6 Summary and Research Gap</h2>
      <p>
        Table 2.1 provides a structured comparative summary of significant published studies in deep learning-based plant disease classification, detailing authors, publication year, utilized datasets, methodologies, reported findings, and inherent limitations.
      </p>

      <div class="caption-table"><b>Table 2.1:</b> Literature survey comparison</div>
      <table class="academic-table">
        <thead>
          <tr>
            <th style="width:16%;">Study</th>
            <th style="width:8%;">Year</th>
            <th style="width:20%;">Dataset / Scope</th>
            <th style="width:18%;">Method</th>
            <th style="width:18%;">Reported Result</th>
            <th style="width:20%;">Key Limitation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mohanty et al. [1]</td>
            <td>2016</td>
            <td>PlantVillage (54,306 laboratory images)</td>
            <td>GoogLeNet & AlexNet transfer learning</td>
            <td>99.35% overall laboratory accuracy</td>
            <td>Severe accuracy drop (<31%) on external field images; heavy background bias.</td>
          </tr>
          <tr>
            <td>Too et al. [2]</td>
            <td>2019</td>
            <td>PlantVillage (38 foliar classes)</td>
            <td>DenseNet-121, ResNet-50, VGG-16</td>
            <td>99.75% accuracy with DenseNet-121</td>
            <td>Large parameter footprint (>80 MB); no mobile edge optimization.</td>
          </tr>
          <tr>
            <td>Ferentinos [3]</td>
            <td>2018</td>
            <td>87,848 multi-crop images (25 species)</td>
            <td>VGG & AlexNet convolutional nets</td>
            <td>99.53% operational test accuracy</td>
            <td>High memory consumption; slow CPU inference; server dependency.</td>
          </tr>
          <tr>
            <td>Singh et al. [7]</td>
            <td>2020</td>
            <td>PlantDoc (2,598 in-field images)</td>
            <td>MobileNet, Inception-V3, Faster R-CNN</td>
            <td>Up to 34% accuracy gain when training on field data</td>
            <td>Modest dataset size; high variance across complex background classes.</td>
          </tr>
          <tr>
            <td>Reza et al. [8]</td>
            <td>2026</td>
            <td>KrishokTech South Asian field data</td>
            <td>YOLO26-cls & Mobile-SAM</td>
            <td>High in-field F1 across Potato & Chilli</td>
            <td>Requires substantial device memory; lacks input blur validation.</td>
          </tr>
          <tr>
            <td>Barbedo [9]</td>
            <td>2018</td>
            <td>12 commercial crops (field conditions)</td>
            <td>GoogLeNet on individual lesion ROIs</td>
            <td>10% to 15% gain by isolating lesions</td>
            <td>Relies on manual lesion annotation; no end-to-end automated mobile flow.</td>
          </tr>
        </tbody>
      </table>
    </div>
    '''
    pages.append((22, "10", "Chapter 2. Literature Survey", p22, False, True))

    # PAGE 23 (Page 11)
    p23 = '''
    <div>
      <h3 class="subsection-title" style="margin-top:0;">2.7 Research Gap</h3>
      <p>
        The comprehensive synthesis of existing literature presented in Table 2.1 highlights three critical research and practical deployment gaps that motivate the design of the proposed platform:
      </p>
      <ol class="academic-list">
        <li>
          <b>Modality and Crop Isolation vs. Multi-Crop Architecture:</b> Existing agricultural diagnostic literature predominantly focuses on single-crop classification models or monolithic classifiers trained across undifferentiated plant species. Monolithic models suffer from severe inter-crop confusion (e.g., misclassifying healthy tomato foliage as diseased chilli leaves). Current architectures lack an isolated multi-crop routing mechanism that dispatches images strictly to dedicated, validated crop models while cleanly segregating upcoming roadmap models.
        </li>
        <li>
          <b>The Laboratory-to-Field Domain Gap & Input Quality Vulnerability:</b> While published models report near-perfect test accuracy (>99%) on curated laboratory datasets, they lack mechanisms to handle real-world photographic deficiencies encountered by farmers, such as motion blur, low natural light, and out-of-domain foliage. No reviewed platform integrates automated pre-inference quality inspection (e.g., Laplacian variance blur detection) combined with calibrated uncertainty thresholding to reject unreadable samples transparently.
        </li>
        <li>
          <b>Edge Latency vs. Cloud Dependency:</b> Most deployed agricultural AI tools rely on cloud-tethered client-server APIs, requiring uncompressed image transmission over cellular networks. In remote farming regions with low bandwidth or zero connectivity, these tools are inaccessible. What is missing is a lightweight, edge-native architecture utilizing WebAssembly (WASM) and ONNX quantization capable of executing deep convolutional inference locally in the mobile browser within sub-second latencies at zero recurring data cost.
        </li>
      </ol>
      <p>
        This project directly addresses these identified gaps by designing, implementing, and validating an integrated multi-crop classification and advisory system. Chapter 3 presents the detailed system design, methodology, and technical implementation.
      </p>
    </div>
    '''
    pages.append((23, "11", "Chapter 2. Literature Survey", p23, False, True))

    return pages

print("Chapters 1 & 2 content module created.")
