/**
 * Softmax Module
 * Computes numerically stable softmax probabilities from raw neural network logits.
 */

export function computeSoftmax(logits: number[] | Float32Array): number[] {
  if (!logits || logits.length === 0) return [];
  const logitsArray = Array.from(logits).map((val) => (Number.isFinite(val) ? val : 0));
  if (logitsArray.length === 0) return [];

  const maxLogit = Math.max(...logitsArray);
  const expScores = logitsArray.map((val) => Math.exp(val - maxLogit));
  const sumExp = expScores.reduce((acc, curr) => acc + curr, 0);

  if (sumExp === 0 || !Number.isFinite(sumExp)) {
    return logitsArray.map(() => 1 / logitsArray.length);
  }

  return expScores.map((val) => val / sumExp);
}
