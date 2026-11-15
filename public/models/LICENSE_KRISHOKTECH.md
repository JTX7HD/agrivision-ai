# Apache License 2.0 & Third-Party Attribution Notice
## KrishokTech Agricultural Pathology Models (Potato & Chilli)

**Source Repository:** [https://huggingface.co/RaiyanKhaan/KrishokTech-Models](https://huggingface.co/RaiyanKhaan/KrishokTech-Models)  
**Authors:** Raiyaan Reza, Raiyan Khaan, and Collaborators  
**License:** Apache License, Version 2.0 (January 2004)  
**Integration Scope in AgriVision AI:**
1. `potato_disease.onnx` (YOLO26s-cls, 21,798,793 bytes, SHA-256: `a71016d001d25cca1d263d33ed284dcf9edecc9636d1ca97f525b80d29563a96`)
2. `chilli_disease.onnx` (YOLO26n-cls, 6,191,953 bytes, SHA-256: `847674752701490177dc9261ae7b1ccacd30b7489ddca8fe4f9a21cae0b79bce`)

---

### Academic Citation & Attribution

```bibtex
@inproceedings{krishokchat2026,
  title={KrishokChat: A Grounded Multi-Modal Agricultural Advisory and Pathology Diagnostic System for Smallholder Farming},
  author={Reza, Raiyaan and Khaan, Raiyan and Collaborators},
  booktitle={Proceedings of the European Chapter of the Association for Computational Linguistics (EACL)},
  year={2026}
}
```

### Statement of Application / Modifications
In accordance with Section 4(b) of the Apache License 2.0:
- The candidate ONNX model checkpoints (`potato_disease.onnx` and `chilli_disease.onnx`) are integrated into AgriVision AI for client-side edge inference via ONNX Runtime WebAssembly (WASM).
- The neural network weights, topology, input tensor specifications (`[1, 3, 224, 224]`, RGB float32 normalized $[0, 1]$), and output heads remain unmodified.
- Dedicated crop adapters (`PotatoClassifierAdapter` with 3 classes and `ChilliClassifierAdapter` with 8 classes) were developed to interface these models directly with AgriVision AI's progressive web application.

---

### Apache License, Version 2.0

```
                              Apache License
                        Version 2.0, January 2004
                     http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.
   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work.

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship.

   "Contribution" shall mean any work of authorship, including the
   original version of the Work and any modifications or additions
   to that Work or Derivative Works thereof, that is intentionally
   submitted to Licensor for inclusion in the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   patent license to make, have made, use, offer to sell, sell, import,
   and otherwise transfer the Work.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or Derivative
       Works a copy of this License; and
   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and
   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work; and
   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file.

5. Submission of Contributions. Unless You explicitly state otherwise,
   any Contribution intentionally submitted for inclusion in the Work
   by You to the Licensor shall be under the terms and conditions of
   this License, without any additional terms or conditions.

6. Trademarks. This License does not grant permission to use the trade
   names, trademarks, service marks, or product names of the Licensor.

7. Disclaimer of Warranty. Unless required by applicable law or
   agreed to in writing, Licensor provides the Work on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
   implied, including, without limitation, any warranties or conditions
   of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
   PARTICULAR PURPOSE.

8. Limitation of Liability. In no event and under no legal theory,
   whether in tort (including negligence), contract, or otherwise,
   shall any Contributor be liable to You for damages, including any
   direct, indirect, special, incidental, or exemplary damages arising
   as a result of this License or out of the use or inability to use
   the Work.

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License.
```
