import React, { useEffect, useState } from 'react';
import type { CropId, FullAnalysisResult, PipelineStageStatus } from '../models/types';
import { getCropById } from '../data/cropsData';
import { analyzeLeafPipeline } from '../services/aiService';
import { PipelineVisualizer } from '../components/analysis/PipelineVisualizer';

interface AnalysisPageProps {
  imageDataUrl: string;
  cropId: CropId;
  onAnalysisComplete: (result: FullAnalysisResult) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  imageDataUrl,
  cropId,
  onAnalysisComplete
}) => {
  const crop = getCropById(cropId);
  const [stages, setStages] = useState<PipelineStageStatus[]>([
    { id: 'yolo11', name: '1. Leaf Detection', modelName: 'YOLO11x-CropVision', description: 'Scanning image frame for leaf geometry...', status: 'idle', durationMs: 450 },
    { id: 'sam', name: '2. Leaf Segmentation & Isolation', modelName: 'SAM-ViT-Huge', description: 'Removing background soil and shadows...', status: 'idle', durationMs: 700 },
    { id: 'resnet50', name: '3. Disease Classification', modelName: 'ResNet-50', description: 'Evaluating deep feature maps against pathogen database...', status: 'idle', durationMs: 650 },
    { id: 'lime', name: '4. LIME Visual Explainability', modelName: 'LIME Analyzer', description: 'Generating superpixel feature importance heatmaps...', status: 'idle', durationMs: 500 }
  ]);

  useEffect(() => {
    let isSubscribed = true;

    const runAnalysis = async () => {
      const finalResult = await analyzeLeafPipeline(
        imageDataUrl,
        cropId,
        (updatedStage) => {
          if (!isSubscribed) return;
          setStages((prev) =>
            prev.map((s) => (s.id === updatedStage.id ? { ...updatedStage } : s))
          );
        }
      );

      if (isSubscribed) {
        setTimeout(() => {
          onAnalysisComplete(finalResult);
        }, 800);
      }
    };

    runAnalysis();

    return () => {
      isSubscribed = false;
    };
  }, [imageDataUrl, cropId, onAnalysisComplete]);

  return (
    <div className="py-6">
      <PipelineVisualizer
        crop={crop}
        imageUrl={imageDataUrl}
        stages={stages}
      />
    </div>
  );
};
