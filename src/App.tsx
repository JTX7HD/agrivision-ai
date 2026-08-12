import React, { useState } from 'react';
import type { CropId, FullAnalysisResult, ScanItem } from './models/types';
import { useScanHistory } from './hooks/useScanHistory';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ScanPage } from './pages/ScanPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedCropId, setSelectedCropId] = useState<CropId>('tomato');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeAnalysisResult, setActiveAnalysisResult] = useState<FullAnalysisResult | null>(null);

  const { scans, addScanFromResult, clearHistory } = useScanHistory();

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCropAndScan = (cropId: CropId) => {
    setSelectedCropId(cropId);
    setSelectedImage(null);
    handleNavigate('/scan');
  };

  const handleStartAnalysis = () => {
    if (!selectedImage) return;
    handleNavigate('/analysis');
  };

  const handleAnalysisComplete = (result: FullAnalysisResult) => {
    setActiveAnalysisResult(result);
    addScanFromResult(result);
    handleNavigate('/results');
  };

  const handleSelectScanFromHistory = (scan: ScanItem) => {
    if (scan.fullResult) {
      setActiveAnalysisResult(scan.fullResult);
    } else {
      setActiveAnalysisResult({
        scanId: scan.id,
        timestamp: scan.timestamp,
        crop: {
          id: scan.cropId,
          name: scan.cropName,
          scientificName: '',
          icon: '🌱',
          accentColor: '#10b981',
          description: '',
          supported: true,
          commonDiseasesCount: 4,
          sampleImageUrl: scan.imageUrl
        },
        disease: {
          id: 'hist-disease',
          cropId: scan.cropId,
          name: scan.diseaseName,
          scientificName: scan.scientificName,
          severity: scan.severity,
          confidence: scan.confidence,
          description: scan.summary,
          symptoms: [scan.summary],
          immediateAction: [scan.recommendationSnippet],
          prevention: ['Maintain good farm sanitation.']
        },
        imageUrl: scan.imageUrl,
        pipelineStages: [],
        yoloBoundingBox: scan.yoloBoundingBox || { x: 20, y: 20, width: 60, height: 60, label: 'Leaf', confidence: 0.95 },
        samSegmentationDataUrl: scan.imageUrl,
        limeFeatures: scan.limeFeatures || [],
        limeHeatmapDataUrl: scan.imageUrl,
        isMockPrediction: true
      });
    }
    handleNavigate('/results');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar currentPath={currentPath} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPath === '/' && (
          <HomePage onNavigate={handleNavigate} />
        )}

        {currentPath === '/dashboard' && (
          <DashboardPage
            scans={scans}
            onNavigate={handleNavigate}
            onSelectScan={handleSelectScanFromHistory}
            onSelectCropAndScan={handleSelectCropAndScan}
          />
        )}

        {currentPath === '/scan' && (
          <ScanPage
            selectedCropId={selectedCropId}
            onSelectCrop={setSelectedCropId}
            selectedImage={selectedImage}
            onImageSelected={setSelectedImage}
            onStartAnalysis={handleStartAnalysis}
          />
        )}

        {currentPath === '/analysis' && selectedImage && (
          <AnalysisPage
            imageDataUrl={selectedImage}
            cropId={selectedCropId}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {currentPath === '/results' && (
          <ResultsPage
            result={activeAnalysisResult}
            onScanAnother={() => {
              setSelectedImage(null);
              handleNavigate('/scan');
            }}
            onGoToDashboard={() => handleNavigate('/dashboard')}
          />
        )}

        {currentPath === '/history' && (
          <HistoryPage
            scans={scans}
            onSelectScan={handleSelectScanFromHistory}
            onClearHistory={clearHistory}
          />
        )}

        {currentPath === '/about' && (
          <AboutPage />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
      <BottomNav currentPath={currentPath} onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
