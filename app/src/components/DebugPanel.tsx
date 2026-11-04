/**
 * Geliştirici paneli (?debug=1). Oyuncuya ML terimi gösterilmez; teknik bilgi yalnızca burada.
 */
import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { ModelState } from '../ml/modelRuntime';
import { RolloutDecision } from '../ml/rollout';
import { FeatureVector } from '../ml/features';

export interface LastPrediction {
  index: number;
  sahne: string;
  p: number | null;
  ms: number | null;
  applied: boolean;
  features: FeatureVector;
  error: string | null;
}

interface Props {
  model: ModelState;
  rollout: RolloutDecision;
  last: LastPrediction | null;
  sessionId: string;
  decisions: number;
  onExport: () => void;
}

const STATUS_LABEL: Record<ModelState['status'], string> = {
  kapali: 'KAPALI',
  yukleniyor: 'YÜKLENİYOR',
  hazir: 'HAZIR',
  'devre-disi': 'DEVRE DIŞI',
};

export const DebugPanel: React.FC<Props> = ({ model, rollout, last, sessionId, decisions, onExport }) => {
  // Varsayılan kapalı: açık panel 390 px ekranda oyun kontrollerinin üstüne biniyordu (FINAL_AUDIT, hata #1).
  const [open, setOpen] = useState(false);
  const cfg = model.config;
  const statusColor =
    model.status === 'hazir' ? 'text-sky-400' : model.status === 'devre-disi' ? 'text-red-400' : 'text-amber-400';

  return (
    <aside
      data-testid="debug-panel"
      className={`fixed bottom-3 right-3 z-50 rounded-lg border ${open ? 'w-[min(92vw,340px)] max-h-[70vh] overflow-y-auto' : 'w-auto'} border-slate-700 bg-slate-950/95 font-mono text-[10px] text-slate-300 shadow-2xl backdrop-blur`}
    >
      <button
        onClick={() => setOpen(!open)}
        data-testid="debug-toggle"
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sky-400"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 font-bold tracking-wider">
          <Cpu className="h-3.5 w-3.5" /> {open ? 'GELİŞTİRİCİ // MODEL' : 'DEV'}
        </span>
        <span className="flex items-center gap-1">
          <span data-testid="model-status" data-status={model.status} className={statusColor}>
            {STATUS_LABEL[model.status]}
          </span>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </span>
      </button>

      {/* İçerik kapalıyken de DOM'da kalır (testler ve olasılık okuması için), yalnızca gizlenir */}
      {(
        <div className={`space-y-2 border-t border-slate-800 px-3 py-2 ${open ? '' : 'hidden'}`}>
          <dl className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5">
            <dt className="text-slate-500">sürüm</dt>
            <dd data-testid="model-version">{cfg ? `${cfg.model_version} (${cfg.release_tag})` : '—'}</dd>
            <dt className="text-slate-500">statü</dt>
            <dd data-testid="model-release-status" className={cfg?.release_status === 'kabul' ? 'text-sky-400' : 'text-amber-400'}>
              {cfg?.release_status ?? '—'}
            </dd>
            <dt className="text-slate-500">kaynak</dt>
            <dd>{model.source === 'huggingface' ? `HF @ ${cfg?.source.hf_commit?.slice(0, 7)}` : model.source ?? '—'}</dd>
            <dt className="text-slate-500">yükleme</dt>
            <dd>{model.loadMs !== null ? `${model.loadMs} ms` : '—'}</dd>
            <dt className="text-slate-500">kol</dt>
            <dd data-testid="rollout-mode" data-mode={rollout.mode}>
              {rollout.mode} · kova {rollout.bucket}
            </dd>
            <dt className="text-slate-500">neden</dt>
            <dd className={rollout.overridden ? 'text-amber-400' : ''}>{rollout.reason}</dd>
            <dt className="text-slate-500">eşik</dt>
            <dd>{cfg?.support_threshold ?? '—'}</dd>
            <dt className="text-slate-500">oturum</dt>
            <dd>
              {sessionId} · {decisions} karar
            </dd>
          </dl>

          {model.error && <p className="text-red-400" data-testid="model-error">{model.error}</p>}
          {rollout.overridden && cfg && cfg.release_status !== 'kabul' && (
            <p className="rounded border border-amber-500/40 bg-amber-500/10 p-1.5 text-amber-300">
              DENEYSEL: Bu model kabul kapılarını geçmedi; uyarlama yalnızca geliştirici geçersiz kılmasıyla açık.
            </p>
          )}

          <div className="border-t border-slate-800 pt-2">
            <div className="text-slate-500">son tahmin {last ? `(karar ${last.index + 1}, ${last.sahne})` : ''}</div>
            <div className="flex items-baseline justify-between">
              <span>
                p ={' '}
                <span data-cy="p" className="text-sm font-bold text-slate-100">
                  {last?.p ?? '—'}
                </span>
              </span>
              <span data-testid="adaptation-applied" className={last?.applied ? 'text-sky-400' : 'text-slate-500'}>
                {last ? (last.applied ? 'UYARLANDI' : 'standart') : ''}
              </span>
            </div>
            {last?.ms !== null && last?.ms !== undefined && <div className="text-slate-500">{last.ms.toFixed(1)} ms</div>}
            {last?.error && <div className="text-red-400">{last.error}</div>}
            {last && (
              <details className="mt-1">
                <summary className="cursor-pointer text-slate-500">özellikler</summary>
                <pre className="mt-1 max-h-32 overflow-auto text-[9px] leading-snug">
                  {JSON.stringify(last.features, null, 1)}
                </pre>
              </details>
            )}
          </div>

          <button
            onClick={onExport}
            disabled={decisions === 0}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-slate-700 py-1.5 text-slate-300 hover:border-sky-500 disabled:opacity-40"
          >
            <Download className="h-3 w-3" /> Oturum CSV
          </button>
        </div>
      )}
    </aside>
  );
};
