# MobileSAM & Meta Segment Anything Model (SAM) License & Attribution

## Apache License 2.0 Notices

The MobileSAM quantized ONNX models (`public/models/mobile_sam.encoder.quant.onnx` and `public/models/mobile_sam.decoder.quant.onnx`) integrated into AgriVision AI are derived from official MobileSAM and Meta AI Segment Anything Model (SAM) architectures and distributed under the **Apache License, Version 2.0**.

### Attribution & Academic Citations

1. **MobileSAM Model Architecture & Distillation:**
   ```bibtex
   @article{zhang2023faster,
     title={Faster Segment Anything: Towards Lightweight SAM on Mobile Devices},
     author={Zhang, Chaoning and Han, Dongshen and Qiao, Yu and Kim, Jung Uk and Bae, Sung-Ho and Lee, Seungkyu and Hong, Choong Seon},
     journal={arXiv preprint arXiv:2306.14289},
     year={2023}
   }
   ```
   Repository: https://github.com/ChaoningZhang/MobileSAM

2. **Meta Segment Anything Model (SAM):**
   ```bibtex
   @article{kirillov2023segany,
     title={Segment Anything},
     author={Kirillov, Alexander and Mintun, Eric and Ravi, Nikhila and Mao, Hanzi and Rolland, Chloe and Gustafson, Laura and Xiao, Tete and Whitehead, Spencer and Berg, Alexander C. and Lo, Wan-Yen and Doll{\'a}r, Piotr and Girshick, Ross},
     journal={arXiv:2304.02643},
     year={2023}
   }
   ```
   Repository: https://github.com/facebookresearch/segment-anything

3. **ONNX Export & Quantization Runtime:**
   Exported and curated by Viet-Anh Nguyen (Neural Research Lab / AnyLabeling), 2023-2026.
   Repository: https://huggingface.co/vietanhdev/segment-anything-onnx-models

### Apache License Version 2.0 Full Text Summary
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
