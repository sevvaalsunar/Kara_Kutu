/**
 * Tarayıcıda ONNX çıkarımı (spec.md §14, §18, §19).
 * Model dosyası: config.source.pinned_url (Hugging Face commit'e sabitli) varsa oradan,
 * yoksa uygulamayla birlikte gelen yerel kopyadan (public/model/) yüklenir.
 */
import { FEATURE_ORDER, FeatureVector, toTensorData } from './features';

export interface FeatureSpec { unit: string; min: number; max: number; type: 'float32'; required: boolean }

export interface ModelConfig {
  model_name: string;
  model_version: string;
  release_tag: string;
  release_status: 'kabul' | 'aday' | 'reddedildi';
  input: { tensor_name: string; dtype: string; feature_order: string[]; features: Record<string, FeatureSpec> };
  output: { tensor_name: string; positive_index: number; class_labels: number[]; semantics: string };
  support_threshold: number;
  artifact: { file: string; sha256: string };
  source: { hf_repo: string | null; hf_commit: string | null; pinned_url: string | null };
  rollout: { mode: 'off' | 'shadow' | 'canary' | 'on'; canary_percent: number };
}

export type ModelStatus = 'kapali' | 'yukleniyor' | 'hazir' | 'devre-disi';

export interface ModelState {
  status: ModelStatus;
  config: ModelConfig | null;
  source: 'yerel' | 'huggingface' | null;
  error: string | null;
  loadMs: number | null;
}

export interface Prediction { p: number; ms: number }

type OrtModule = typeof import('onnxruntime-web/wasm');
type Session = Awaited<ReturnType<OrtModule['InferenceSession']['create']>>;

const BASE = import.meta.env.BASE_URL;

let ortMod: OrtModule | null = null;
let session: Session | null = null;
let state: ModelState = { status: 'kapali', config: null, source: null, error: null, loadMs: null };
const listeners = new Set<(s: ModelState) => void>();

const setState = (patch: Partial<ModelState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
};

export const getModelState = () => state;
export const subscribeModel = (fn: (s: ModelState) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Yapılandırmanın uygulamanın beklediği sözleşmeyle uyumunu denetler; uyumsuzsa hata mesajı döner. */
export function checkConfig(cfg: ModelConfig): string | null {
  const order = cfg?.input?.feature_order;
  if (!Array.isArray(order) || order.join(',') !== FEATURE_ORDER.join(','))
    return 'Özellik sırası uygulamanın sözleşmesiyle uyuşmuyor.';
  if (cfg.input.tensor_name !== 'features' || cfg.input.dtype !== 'float32') return 'Girdi tensörü beklenen biçimde değil.';
  if (cfg.output?.tensor_name !== 'probabilities' || cfg.output.positive_index !== 1) return 'Çıktı tensörü beklenen biçimde değil.';
  if (!(cfg.support_threshold > 0 && cfg.support_threshold < 1)) return 'Destek eşiği (0, 1) aralığında değil.';
  for (const f of FEATURE_ORDER) {
    const s = cfg.input.features?.[f];
    if (!s || typeof s.min !== 'number' || typeof s.max !== 'number') return `Özellik tanımı eksik: ${f}`;
  }
  if (!/^[0-9a-f]{64}$/.test(cfg.artifact?.sha256 ?? '')) return 'Model özeti (sha256) eksik.';
  if (!['kabul', 'aday', 'reddedildi'].includes(cfg.release_status)) return 'Sürüm statüsü tanımsız.';
  return null;
}

/** Özellikleri sözleşmedeki aralıklara göre denetler; geçersizse hata mesajı döner. */
export function checkFeatures(f: FeatureVector, cfg: ModelConfig): string | null {
  for (const name of FEATURE_ORDER) {
    const v = f[name];
    const s = cfg.input.features[name];
    if (typeof v !== 'number' || !Number.isFinite(v)) return `${name} eksik veya sayı değil`;
    if (v < s.min || v > s.max) return `${name}=${v} aralık dışı [${s.min}, ${s.max}]`;
  }
  return null;
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Bu bağlamda crypto.subtle yok; model bütünlüğü doğrulanamadı.');
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface LoadOptions { broken?: boolean }

export async function loadModel(opts: LoadOptions = {}): Promise<ModelState> {
  if (state.status === 'yukleniyor' || state.status === 'hazir') return state;
  const t0 = performance.now();
  setState({ status: 'yukleniyor', error: null });
  try {
    const cfgRes = await fetch(`${BASE}model/config.json`, { cache: 'no-cache' });
    if (!cfgRes.ok) throw new Error(`config.json alınamadı (HTTP ${cfgRes.status})`);
    const cfg = (await cfgRes.json()) as ModelConfig;
    const cfgErr = checkConfig(cfg);
    if (cfgErr) throw new Error(cfgErr);

    const pinned = cfg.source?.pinned_url;
    const source: ModelState['source'] = pinned ? 'huggingface' : 'yerel';
    const url = opts.broken ? `${BASE}model/bulunamayan-model.onnx` : pinned ?? `${BASE}model/model.onnx`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Model indirilemedi (HTTP ${res.status})`);
    const bytes = await res.arrayBuffer();
    const digest = await sha256Hex(bytes);
    if (digest !== cfg.artifact.sha256) throw new Error('Model özeti config.json ile uyuşmuyor; dosya reddedildi.');

    ortMod = await import('onnxruntime-web/wasm');
    ortMod.env.wasm.numThreads = 1; // GitHub Pages COOP/COEP vermez; tek iş parçacığı
    ortMod.env.wasm.wasmPaths = new URL(`${BASE}ort/`, window.location.href).href;
    session = await ortMod.InferenceSession.create(new Uint8Array(bytes));
    if (!session.inputNames.includes('features') || !session.outputNames.includes('probabilities'))
      throw new Error('Model girdi/çıktı adları sözleşmeyle uyuşmuyor.');

    setState({ status: 'hazir', config: cfg, source, loadMs: Math.round(performance.now() - t0) });
  } catch (err) {
    session = null;
    setState({ status: 'devre-disi', error: err instanceof Error ? err.message : String(err) });
    console.warn('[KARA KUTU] Model devre dışı:', err);
  }
  return state;
}

export async function predict(f: FeatureVector): Promise<Prediction> {
  if (!session || !ortMod || !state.config) throw new Error('Model hazır değil.');
  const err = checkFeatures(f, state.config);
  if (err) throw new Error(`Geçersiz özellik: ${err}`);
  const t0 = performance.now();
  const data = toTensorData(f, state.config.input.feature_order);
  const tensor = new ortMod.Tensor('float32', data, [1, data.length]);
  const out = await session.run({ features: tensor });
  const p = Number((out.probabilities.data as Float32Array)[state.config.output.positive_index]);
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new Error(`Geçersiz olasılık: ${p}`);
  return { p, ms: performance.now() - t0 };
}
