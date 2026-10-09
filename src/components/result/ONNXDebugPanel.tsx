import React, { useState } from 'react';
import type { FullAnalysisResult } from '../../models/types';
import { Terminal, ChevronDown, ChevronUp, Copy, Check, Layers, Cpu, Eye, Scan, Search } from 'lucide-react';
import { MOBILENETV3_V2_METADATA } from '../../services/pipeline/diseaseClassifierService';

interface ONNXDebugPanelProps {
  result: FullAnalysisResult;
}

export const ONNXDebugPanel: React.FC<ONNXDebugPanelProps> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    scanId,
    timestamp,
    predictedClassIndex,
    predictedClassName,
    confidence,
    classProbabilities,
    rawLogits,
    pipelineStages,
    classifierInfo
  } = result;

  const activeModelInfo = classifierInfo || MOBILENETV3_V2_METADATA;

  const debugJson = JSON.stringify(
    {
      requestId: scanId,
      timestamp,
      modelArchitecture: activeModelInfo.modelName,
      checkpoint: activeModelInfo.checkpoint,
      benchmarks: {
        plantVillageAccuracy: `${activeModelInfo.plantVillageAccuracy}%`,
        plantDocAccuracy: `${activeModelInfo.plantDocAccuracy}%`
      },
      pipelineFlow: [
        '1. Image Quality Inspection',
        '2. YOLO Leaf Detection (ROI)',
        '3. SAM Leaf Segmentation',
        '4. MobileNetV3 V2 Disease Classification',
        '5. Confidence Calibration & Softmax',
        '6. LIME Explainability',
        '7. Disease Knowledge & Agronomic Guidance'
      ],
      predictedClassIndex,
      predictedClassName,
      confidence: `${confidence.toFixed(2)}%`,
      inputShape: activeModelInfo.inputShape,
      rawLogits,
      allClassProbabilities: classProbabilities,
      pipelineStages
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(debugJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-slate-900/80 hover:bg-slate-900 flex items-center justify-between text-left transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>AI Pipeline & MobileNetV3 V2 Debugger</span>
          <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-800">
            {activeModelInfo.checkpoint}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-mono">
            {isOpen ? 'Hide Trace' : 'View Pipeline Architecture & Trace'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 text-xs font-mono text-slate-300 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold">Pipeline Architecture & Model Verification:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied JSON' : 'Copy Evidence'}</span>
            </button>
          </div>

          {/* Model Specs Card */}
          <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Production Baseline Classifier: {activeModelInfo.modelName}
              </span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-emerald-400 border border-emerald-800 font-mono">
                {activeModelInfo.checkpoint}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-400">PlantVillage Test:</div>
                <div className="font-bold text-emerald-400 text-xs">{activeModelInfo.plantVillageAccuracy}%</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-400">PlantDoc Test:</div>
                <div className="font-bold text-amber-400 text-xs">{activeModelInfo.plantDocAccuracy}%</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-400">Tensor Shape:</div>
                <div className="font-bold text-slate-200 text-xs">[1, 3, 224, 224]</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-400">Execution:</div>
                <div className="font-bold text-slate-200 text-xs">Client WASM</div>
              </div>
            </div>
          </div>

          {/* Pipeline Stage Architecture Flow */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400">Multi-Stage Pipeline Execution:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">1. Quality Inspection</div>
                  <div className="text-slate-500">Lighting, contrast, focus validator</div>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Scan className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">2. YOLO Leaf Detection</div>
                  <div className="text-slate-500">Bounding box ROI extraction</div>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">3. SAM Leaf Segmentation</div>
                  <div className="text-slate-500">Leaf contour & shadow isolation</div>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">4. MobileNetV3 V2 Classifier</div>
                  <div className="text-slate-500">10-class PlantVillage tensor inference</div>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">5. LIME Explainability</div>
                  <div className="text-slate-500">Superpixel diagnostic heatmaps</div>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">6. Agronomic Guidance</div>
                  <div className="text-slate-500">Verified pathology & treatments</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div><span className="text-slate-400">Request ID:</span> <span className="text-emerald-400 font-bold">{scanId}</span></div>
            <div><span className="text-slate-400">Timestamp:</span> <span>{timestamp}</span></div>
            <div><span className="text-slate-400">Argmax Index:</span> <span className="text-emerald-400 font-bold">{predictedClassIndex}</span></div>
            <div><span className="text-slate-400">Argmax Class:</span> <span className="text-emerald-400 font-bold">{predictedClassName}</span></div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400">10 Raw Output Logits:</div>
            <pre className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 overflow-x-auto text-[10px] text-amber-300">
              {JSON.stringify(rawLogits, null, 2)}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400">All 10 Softmax Probabilities:</div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
              {classProbabilities.map((item) => (
                <div key={item.classIndex} className="flex items-center justify-between text-[11px]">
                  <span className={item.classIndex === predictedClassIndex ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    [{item.classIndex}] {item.displayName}
                  </span>
                  <span className={item.classIndex === predictedClassIndex ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {item.probability.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
