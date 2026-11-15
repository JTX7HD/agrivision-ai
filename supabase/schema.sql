-- AgriVision AI - Direct Correction Learning Schema
-- Table for persistent tomato leaf corrections

CREATE TABLE IF NOT EXISTS public.leaf_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  image_url TEXT NOT NULL,
  original_image_hash TEXT NOT NULL, -- SHA-256 hash of original image to prevent duplicates
  corrected_class_index INTEGER NOT NULL CHECK (corrected_class_index >= 0 AND corrected_class_index <= 9),
  corrected_class_name TEXT NOT NULL,
  predicted_class_index INTEGER NOT NULL CHECK (predicted_class_index >= 0 AND predicted_class_index <= 9),
  predicted_class_name TEXT NOT NULL,
  confidence NUMERIC(5, 2) NOT NULL,
  model_version TEXT NOT NULL DEFAULT '2.0.0-ONNX',
  model_checkpoint TEXT NOT NULL DEFAULT 'best_tomato_mobilenetv3_v2.pth',
  crop_id TEXT NOT NULL DEFAULT 'tomato',
  yolo_box JSONB, -- { x, y, width, height, confidence }
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected', 'trained')),
  trained_at TIMESTAMPTZ,
  trained_in_model_version TEXT
);

-- Unique constraint on image hash to prevent duplicate submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaf_corrections_hash ON public.leaf_corrections (original_image_hash);

-- Indexes for fast querying & export
CREATE INDEX IF NOT EXISTS idx_leaf_corrections_created_at ON public.leaf_corrections (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaf_corrections_corrected_class ON public.leaf_corrections (corrected_class_index);
CREATE INDEX IF NOT EXISTS idx_leaf_corrections_status ON public.leaf_corrections (status);

-- Model registry to track candidate evaluations and deployments
CREATE TABLE IF NOT EXISTS public.model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  version TEXT NOT NULL UNIQUE,
  checkpoint_name TEXT NOT NULL,
  base_version TEXT,
  pv_accuracy NUMERIC(5, 2),
  plantdoc_accuracy NUMERIC(5, 2),
  validation_loss NUMERIC(6, 4),
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_candidate BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'evaluated', -- 'evaluating', 'passed', 'rejected', 'active', 'rolled_back'
  regression_notes TEXT,
  onnx_path TEXT,
  total_training_samples INTEGER,
  total_corrections_used INTEGER
);

-- Insert initial production baseline record
INSERT INTO public.model_registry (
  version, checkpoint_name, is_active, is_candidate, status, pv_accuracy, plantdoc_accuracy, total_training_samples
) VALUES (
  '2.0.0-ONNX', 'best_tomato_mobilenetv3_v2.pth', true, false, 'active', 99.56, 47.54, 18656
) ON CONFLICT (version) DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE public.leaf_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_registry ENABLE ROW LEVEL SECURITY;

-- Allow read access for public/authenticated
CREATE POLICY "Allow read access to leaf_corrections" ON public.leaf_corrections
  FOR SELECT USING (true);

-- Allow insert access via service role or anon
CREATE POLICY "Allow insert access to leaf_corrections" ON public.leaf_corrections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read access to model_registry" ON public.model_registry
  FOR SELECT USING (true);
