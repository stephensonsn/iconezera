// Licenças SPDX que permitem uso (inclusive comercial) sem exigir crédito ao autor.
const NO_ATTRIBUTION_SPDX = new Set([
  "MIT",
  "Apache-2.0",
  "ISC",
  "CC0-1.0",
  "Unlicense",
  "BSD-3-Clause",
  "OFL-1.1",
]);

export function isAttributionFree(spdx: string | undefined): boolean {
  return spdx !== undefined && NO_ATTRIBUTION_SPDX.has(spdx);
}
