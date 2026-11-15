import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { auditDataset, auditSavedBenchmark, formatAudit } from '../audit_field_benchmark.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const saved = JSON.parse(readFileSync(resolve(root, 'data/benchmark/results/benchmark_summary.json'), 'utf8'));

test('saved tomato benchmark exposes field generalization gap and safety flags', () => {
  const report = auditSavedBenchmark(saved);
  assert.equal(report.PlantDoc.evaluated, 63);
  assert.equal(report.PlantDoc.correct, 29);
  assert.equal(report.PlantDoc.accuracyPercent, 46.03);
  assert.equal(report.PlantVillage.evaluated, 100);
  assert.equal(report.PlantVillage.correct, 100);
  assert.equal(report.PlantDoc.healthy.support, 8);
  assert.equal(report.PlantDoc.healthy.correct, 0);
  assert.equal(report.PlantDoc.missingClasses.length, 2);
  assert.equal(report.PlantDoc.uncertainty.errorsMissed, 17);
  assert.match(formatAudit(report), /saved tomato benchmark audit/);
});

test('reject incorrect confusion matrix totals', () => {
  const corrupt = structuredClone(saved.datasets.PlantDoc);
  corrupt.confusion_matrix[0][0] += 1;
  assert.throws(() => auditDataset('corrupt', corrupt), /confusion matrix totals/);
});

test('reject incorrect per-class support totals', () => {
  const corrupt = structuredClone(saved.datasets.PlantDoc);
  corrupt.per_class_metrics[0].support = 100;
  assert.throws(() => auditDataset('corrupt', corrupt), /supports/);
});
