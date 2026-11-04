// Model yapıtlarını ve ORT-web WASM dosyalarını public/ altına kopyalar (predev / prebuild).
// Öncelik: ../model/ (kabul veya aday) → ../model/gelistirme/ (reddedildi; yalnızca gölge mod).
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(app, '..');
const candidates = [join(root, 'model'), join(root, 'model', 'gelistirme')];
const src = candidates.find((d) => existsSync(join(d, 'model.onnx')) && existsSync(join(d, 'config.json')));

const outModel = join(app, 'public', 'model');
rmSync(outModel, { recursive: true, force: true });
if (!src) {
  console.warn('[sync-model] Model bulunamadı; oyun modelsiz (v1 kuralları) çalışacak.');
} else {
  const cfg = JSON.parse(readFileSync(join(src, 'config.json'), 'utf8'));
  const sha = createHash('sha256').update(readFileSync(join(src, 'model.onnx'))).digest('hex');
  if (sha !== cfg.artifact.sha256) {
    console.error('[sync-model] model.onnx özeti config.json ile uyuşmuyor; kopyalanmadı.');
    process.exit(1);
  }
  mkdirSync(outModel, { recursive: true });
  for (const f of ['model.onnx', 'config.json']) copyFileSync(join(src, f), join(outModel, f));
  console.log(`[sync-model] ${cfg.model_name} ${cfg.model_version} (${cfg.release_status}) ← ${src}`);
}

const ortDist = join(app, 'node_modules', 'onnxruntime-web', 'dist');
const outOrt = join(app, 'public', 'ort');
mkdirSync(outOrt, { recursive: true });
for (const f of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) copyFileSync(join(ortDist, f), join(outOrt, f));
console.log('[sync-model] ORT-web WASM dosyaları → public/ort/');
