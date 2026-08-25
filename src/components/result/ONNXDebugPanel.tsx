import React, { useState } from 'react';
import type { FullAnalysisResult } from '../../models/types';
import { Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

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
    rawLogits
  } = result;

  const debugJson = JSON.stringify(
    {
      requestId: scanId,
      timestamp,
      predictedClassIndex,
      predictedClassName,
      confidence: `${confidence.toFixed(2)}%`,
      inputShape: [1, 3, 224, 224],
      rawLogits,
      allClassProbabilities: classProbabilities
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
          <span>Developer ONNX Pipeline Debugger</span>
          <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-800">
            ID: {scanId}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-mono">
            {isOpen ? 'Hide Evidence' : 'View Pipeline Trace'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 text-xs font-mono text-slate-300 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold">ONNX Runtime Pipeline Evidence:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied JSON' : 'Copy Evidence'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div><span className="text-slate-400">Request ID:</span> <span className="text-emerald-400 font-bold">{scanId}</span></div>
            <div><span className="text-slate-400">Timestamp:</span> <span>{timestamp}</span></div>
            <div><span className="text-slate-400">Tensor Shape:</span> <span className="text-amber-300">[1, 3, 224, 224]</span></div>
            <div><span className="text-slate-400">ONNX Input:</span> <span className="text-amber-300">input_leaf_tensor</span></div>
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
