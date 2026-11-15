import { createClient } from '@supabase/supabase-js';
import { put } from '@vercel/blob';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface RawCorrectionInput {
  imageDataUrl: string;
  correctedClassIndex: number;
  correctedClassName: string;
  predictedClassIndex: number;
  predictedClassName: string;
  confidence: number;
  modelVersion?: string;
  modelCheckpoint?: string;
  cropId?: string;
  yoloBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
  };
  notes?: string;
}

export interface StoredCorrection {
  id: string;
  created_at: string;
  timestamp: string;
  image_url: string;
  image_path?: string;
  original_image_hash: string;
  sha256: string;
  corrected_class_index: number;
  corrected_class_name: string;
  predicted_class_index: number;
  predicted_class_name: string;
  confidence: number;
  predicted_confidence?: number;
  model_version: string;
  model_checkpoint: string;
  crop_id: string;
  yolo_box?: unknown;
  notes?: string;
  training_status: 'approved' | 'pending' | 'rejected' | 'trained';
  status: 'approved' | 'pending' | 'rejected' | 'trained';
  storage_provider: 'vercel-blob+supabase' | 'local-filesystem' | 'vercel-ephemeral';
}

// Persistent local storage under data/corrections/images/ and data/corrections/manifest.json
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data', 'corrections');
const LOCAL_IMAGES_DIR = path.join(DATA_DIR, 'images');
const LOCAL_MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');

function ensureLocalDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_IMAGES_DIR)) {
    fs.mkdirSync(LOCAL_IMAGES_DIR, { recursive: true });
  }
  const gitkeep = path.join(LOCAL_IMAGES_DIR, '.gitkeep');
  if (!fs.existsSync(gitkeep)) {
    try {
      fs.writeFileSync(gitkeep, '', 'utf-8');
    } catch {
      // ignore
    }
  }

  // If manifest.json does not exist, check if legacy .data/ exists to migrate
  if (!fs.existsSync(LOCAL_MANIFEST_PATH)) {
    const legacyJson = path.join(ROOT_DIR, '.data', 'corrections.json');
    const legacyImages = path.join(ROOT_DIR, '.data', 'images');
    let migrated: StoredCorrection[] = [];

    if (fs.existsSync(legacyJson)) {
      try {
        const raw = fs.readFileSync(legacyJson, 'utf-8');
        const legacyList = JSON.parse(raw);
        if (Array.isArray(legacyList)) {
          migrated = legacyList.map((item) => ({
            ...item,
            timestamp: item.timestamp || item.created_at || new Date().toISOString(),
            sha256: item.sha256 || item.original_image_hash,
            training_status: item.training_status || item.status || 'approved',
            status: item.status || item.training_status || 'approved',
            predicted_confidence: item.predicted_confidence ?? item.confidence ?? 0,
            storage_provider: 'local-filesystem' as const
          }));
        }
        if (fs.existsSync(legacyImages)) {
          const files = fs.readdirSync(legacyImages);
          for (const file of files) {
            const src = path.join(legacyImages, file);
            const dst = path.join(LOCAL_IMAGES_DIR, file);
            if (!fs.existsSync(dst) && fs.statSync(src).isFile()) {
              fs.copyFileSync(src, dst);
            }
          }
        }
      } catch (e) {
        console.warn('Migration warning:', e);
      }
    }
    fs.writeFileSync(LOCAL_MANIFEST_PATH, JSON.stringify(migrated, null, 2), 'utf-8');
  }
}

export function getStorageDiagnostics() {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL);
  const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

  const isCloudConfigured = hasBlobToken && hasSupabaseUrl && hasSupabaseKey;

  let mode: 'production-cloud' | 'local-persistent' | 'vercel-ephemeral-unconfigured';
  let isPersistent: boolean;
  let persistenceWarning: string | null = null;

  if (isCloudConfigured) {
    mode = 'production-cloud';
    isPersistent = true;
  } else if (isVercel) {
    mode = 'vercel-ephemeral-unconfigured';
    isPersistent = false;
    persistenceWarning =
      'Running on Vercel Serverless without cloud database credentials (SUPABASE_URL and BLOB_READ_WRITE_TOKEN). Corrections saved to the serverless filesystem will NOT persist across serverless instances or redeployments.';
  } else {
    mode = 'local-persistent';
    isPersistent = true;
  }

  return {
    isCloudConfigured,
    isPersistent,
    isVercel,
    hasBlobToken,
    hasSupabaseUrl,
    hasSupabaseKey,
    mode,
    persistenceWarning,
    localStorageLocation: {
      manifest: 'data/corrections/manifest.json',
      images: 'data/corrections/images/'
    },
    missingCredentials: [
      !hasBlobToken && 'BLOB_READ_WRITE_TOKEN',
      !hasSupabaseUrl && 'SUPABASE_URL',
      !hasSupabaseKey && 'SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)'
    ].filter(Boolean) as string[]
  };
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function parseDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      buffer: Buffer.from(matches[2], 'base64')
    };
  }
  // Try raw base64 fallback
  return {
    mimeType: 'image/jpeg',
    buffer: Buffer.from(dataUrl, 'base64')
  };
}

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Persists an image either to Vercel Blob (production) or local data/corrections/images/ (local dev)
 */
export async function persistImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; relativePath: string; provider: 'vercel-blob' | 'local' }> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`corrections/${filename}`, buffer, {
      access: 'public',
      contentType: mimeType
    });
    return { url: blob.url, relativePath: `corrections/${filename}`, provider: 'vercel-blob' };
  }

  // Local filesystem persistence in data/corrections/images/
  ensureLocalDirs();
  const filePath = path.join(LOCAL_IMAGES_DIR, filename);
  fs.writeFileSync(filePath, buffer);

  const relativePath = path.join('data', 'corrections', 'images', filename).replace(/\\/g, '/');
  const base64 = buffer.toString('base64');
  const url = `data:${mimeType};base64,${base64}`;

  return { url, relativePath, provider: 'local' };
}

/**
 * Check if image already exists in database/store by hash
 */
export async function findCorrectionByHash(hash: string): Promise<StoredCorrection | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('leaf_corrections')
      .select('*')
      .eq('original_image_hash', hash)
      .maybeSingle();

    if (!error && data) {
      return {
        ...(data as StoredCorrection),
        timestamp: data.created_at,
        sha256: data.original_image_hash,
        training_status: data.status,
        predicted_confidence: data.confidence,
        storage_provider: 'vercel-blob+supabase'
      };
    }
  }

  // Check local filesystem under data/corrections/manifest.json
  ensureLocalDirs();
  try {
    const raw = fs.readFileSync(LOCAL_MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const items: StoredCorrection[] = Array.isArray(parsed) ? parsed : (parsed.corrections || parsed.samples || []);
    const found = items.find((i) => i.original_image_hash === hash || i.sha256 === hash);
    return found || null;
  } catch {
    return null;
  }
}

/**
 * Save new correction record to Supabase or local persistent manifest
 */
export async function saveCorrectionRecord(
  record: Omit<StoredCorrection, 'id' | 'created_at' | 'timestamp'> & { timestamp?: string; sha256?: string; training_status?: 'approved' | 'pending' | 'rejected' | 'trained'; image_path?: string; predicted_confidence?: number }
): Promise<StoredCorrection> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const sha256 = record.sha256 || record.original_image_hash;
  const trainingStatus = record.training_status || record.status || 'approved';
  const confidence = record.confidence ?? record.predicted_confidence ?? 0;

  if (supabase) {
    const { data, error } = await supabase
      .from('leaf_corrections')
      .insert({
        id,
        created_at: now,
        image_url: record.image_url,
        original_image_hash: sha256,
        corrected_class_index: record.corrected_class_index,
        corrected_class_name: record.corrected_class_name,
        predicted_class_index: record.predicted_class_index,
        predicted_class_name: record.predicted_class_name,
        confidence,
        model_version: record.model_version,
        model_checkpoint: record.model_checkpoint,
        crop_id: record.crop_id,
        yolo_box: record.yolo_box,
        notes: record.notes,
        status: trainingStatus
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return {
      ...(data as StoredCorrection),
      timestamp: now,
      sha256,
      training_status: trainingStatus,
      predicted_confidence: confidence,
      storage_provider: 'vercel-blob+supabase'
    };
  }

  // Local filesystem persistence
  ensureLocalDirs();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const provider = isVercel ? 'vercel-ephemeral' : 'local-filesystem';

  const stored: StoredCorrection = {
    id,
    created_at: now,
    timestamp: now,
    ...record,
    original_image_hash: sha256,
    sha256,
    confidence,
    predicted_confidence: confidence,
    training_status: trainingStatus,
    status: trainingStatus,
    storage_provider: provider
  };

  const raw = fs.readFileSync(LOCAL_MANIFEST_PATH, 'utf-8');
  let items: StoredCorrection[] = [];
  try {
    const parsed = JSON.parse(raw);
    items = Array.isArray(parsed) ? parsed : (parsed.corrections || parsed.samples || []);
  } catch {
    items = [];
  }

  items.unshift(stored);
  fs.writeFileSync(LOCAL_MANIFEST_PATH, JSON.stringify(items, null, 2), 'utf-8');

  return stored;
}

/**
 * Query all corrections from Supabase or local persistent manifest
 */
export async function getAllCorrections(): Promise<StoredCorrection[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from('leaf_corrections')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((d) => ({
        ...d,
        timestamp: d.created_at,
        sha256: d.original_image_hash,
        training_status: d.status,
        predicted_confidence: d.confidence,
        storage_provider: 'vercel-blob+supabase' as const
      }));
    }
  }

  // Fallback to local manifest
  ensureLocalDirs();
  try {
    const raw = fs.readFileSync(LOCAL_MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed.corrections || parsed.samples || []);
  } catch {
    return [];
  }
}

