#!/usr/bin/env node
/** Read-only validation of AgriVision AI saved tomato benchmark results. Does NOT run model inference. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BENCHMARK = resolve(ROOT, 'data/benchmark/results/benchmark_summary.json');

function assertInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) throw new Error("Invalid " + name + ": " + value);
}

export function auditDataset(name, dataset) {
  if (!dataset || !Array.isArray(dataset.per_class_metrics) || !Array.isArray(dataset.confusion_matrix)) {
    throw new Error("Missing per-class metrics or confusion matrix for " + name);
  }
  const n = dataset.evaluated_images;
  const correct = dataset.top1_correct_count;
  assertInteger(n, name + " evaluated images");
  assertInteger(correct, name + " correct predictions");
  if (n === 0 || correct > n) throw new Error("Invalid sample count for " + name);
  const supportCount = dataset.per_class_metrics.reduce((sum, row, idx) => {
    assertInteger(row.support, name + " support for class " + idx);
    return sum + row.support;
  }, 0);
  if (supportCount !== n) throw new Error(name + " per-class supports (" + supportCount + ") do not sum to evaluated images (" + n + ")");
  const matrix = dataset.confusion_matrix;
  if (matrix.length !== dataset.per_class_metrics.length || matrix.some(row => !Array.isArray(row) || row.length !== matrix.length)) {
    throw new Error(name + " confusion matrix dimensions do not match the classes");
  }
  const total = matrix.flat().reduce((sum, count) => {
    assertInteger(count, name + " confusion matrix entry");
    return sum + count;
  }, 0);
  const diagonal = matrix.reduce((sum, row, i) => sum + row[i], 0);
  if (total !== n || diagonal !== correct) {
    throw new Error(name + " confusion matrix totals (" + total + ", " + diagonal + ") disagree with saved results (" + n + ", " + correct + ")");
  }
  const supported = dataset.per_class_metrics.filter(row => row.support > 0);
  const missing = dataset.per_class_metrics.filter(row => row.support === 0).map(row => row.display_name || row.class_name);
  const healthy = dataset.per_class_metrics.find(row => /healthy/i.test(row.display_name || row.class_name || ""));
  const uncertainty = dataset.uncertainty_evaluation;
  const interception = uncertainty?.error_interception_contingency;
  return {
    name,
    evaluated: n,
    correct,
    incorrect: n - correct,
    accuracyPercent: Number((100 * correct / n).toFixed(2)),
    top2AccuracyPercent: dataset.top2_accuracy_percent,
    supportedClasses: supported.length,
    totalClasses: dataset.per_class_metrics.length,
    missingClasses: missing,
    macroRecallPercentSupported: Number((supported.reduce((sum, row) => sum + (row.recall_percent ?? 0), 0) / supported.length).toFixed(2)),
    healthy: healthy ? { support: healthy.support, correct: healthy.true_positives, recallPercent: healthy.recall_percent } : null,
    uncertainty: uncertainty ? {
      flagged: uncertainty.flagged_count,
      errorsCaught: interception?.true_positives_error_caught ?? null,
      errorsMissed: interception?.false_negatives_silent_error ?? null,
      confidentSubsetAccuracyPercent: uncertainty.clean_subset_performance?.accuracy_percent ?? null
    } : null
  };
}

export function auditSavedBenchmark(saved) {
  const village = auditDataset("PlantVillage", saved?.datasets?.PlantVillage);
  const doc = auditDataset("PlantDoc", saved?.datasets?.PlantDoc);
  return {
    source: "Saved benchmark results; NOT a new inference run",
    evaluationTimestamp: saved?.meta?.timestamp_end_utc ?? null,
    model: saved?.meta?.model_evaluated ?? null,
    manifestSha256: saved?.meta?.manifest_sha256 ?? null,
    PlantVillage: village,
    PlantDoc: doc,
    fieldAccuracyGapPercentagePoints: Number((village.accuracyPercent - doc.accuracyPercent).toFixed(2)),
    limitations: [
      "This 163-image saved benchmark evaluates the tomato classifier only.",
      "PlantDoc includes no field-test samples for two tomato classes.",
      "The field test contains only 63 images; do not generalize to all farms.",
      "Never use the held-out benchmark to train or tune thresholds."
    ]
  };
}

export function formatAudit(audit) {
  const pv = audit.PlantVillage, pd = audit.PlantDoc;
  return [
    "AgriVision AI - saved tomato benchmark audit (" + (audit.evaluationTimestamp ?? "date unknown") + ")",
    "Model: " + (audit.model ?? "unknown"),
    "PlantVillage: " + pv.correct + "/" + pv.evaluated + " (" + pv.accuracyPercent + "%)",
    "PlantDoc: " + pd.correct + "/" + pd.evaluated + " (" + pd.accuracyPercent + "%)",
    "Field gap: " + audit.fieldAccuracyGapPercentagePoints + " percentage points",
    "PlantDoc classes: " + pd.supportedClasses + "/" + pd.totalClasses + " (missing: " + pd.missingClasses.join(", ") + ")",
    "PlantDoc healthy recall: " + pd.healthy?.correct + "/" + pd.healthy?.support + " (" + pd.healthy?.recallPercent + "%)",
    "PlantDoc uncertain: " + pd.uncertainty?.flagged + "; errors flagged: " + pd.uncertainty?.errorsCaught + "; errors missed: " + pd.uncertainty?.errorsMissed,
    "Historical saved results only. This command does not run inference."
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--json')) {
    console.error('Usage: node scripts/audit_field_benchmark.mjs [--json]');
    process.exitCode = 2;
  } else {
    try {
      const saved = JSON.parse(readFileSync(BENCHMARK, 'utf8'));
      const audit = auditSavedBenchmark(saved);
      console.log(args.includes('--json') ? JSON.stringify(audit, null, 2) : formatAudit(audit));
    } catch (err) {
      console.error('Field benchmark audit failed: ' + err.message);
      process.exitCode = 1;
    }
  }
}
