/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, CheckCircle2, AlertOctagon, ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';
import {
  GOOD_ENDING,
  getBadEndingReason,
  formatDecisionSummary,
  DecisionRecord,
} from '../story';

interface EndingViewProps {
  path: string[]; // e.g. ['1B', '2B1', 'A']
  clock: string;
  onRestart: () => void;
}

export const EndingView: React.FC<EndingViewProps> = ({ path, clock, onRestart }) => {
  const pathKey = path.join(' -> ');
  const isGood = pathKey === '1B -> 2B1 -> A';
  const endingType = isGood ? 'good' : 'bad';

  const reasonText = isGood ? GOOD_ENDING.description! : getBadEndingReason(pathKey);
  const decisionSummary: DecisionRecord[] = formatDecisionSummary(path);

  return (
    <div
      data-testid="ending"
      data-ending={endingType}
      className="max-w-md mx-auto px-4 py-4 space-y-4 pb-20"
    >
      {/* Top Mission Status Banner */}
      {isGood ? (
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>■ MİSYON TAMAMLANDI • BAŞARILI SON</span>
          </div>
          <span className="text-slate-400 font-mono">T+03:28:14</span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-red-500/15 border border-red-500/40 text-red-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>■ MİSYON BAŞARISIZ • KÖTÜ SON</span>
          </div>
          <span className="text-slate-400 font-mono">T+{clock}:00</span>
        </div>
      )}

      {/* Main Report Box */}
      <div
        className={`p-4 rounded-lg border shadow-2xl space-y-3 relative overflow-hidden ${
          isGood
            ? 'bg-slate-900/90 border-sky-500/40'
            : 'bg-slate-900/90 border-red-500/40'
        }`}
      >
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>
            {isGood
              ? '// PROTOKOL-SON: İNCELEME_RAPORU'
              : '// PROTOKOL-SON: [KOD-ERR] İHLAL'}
          </span>
          <span
            className={`font-semibold ${
              isGood ? 'text-sky-400' : 'text-red-400'
            }`}
          >
            {isGood ? '[KOD-0] TAMAMLIK' : 'TESPİTİ'}
          </span>
        </div>

        {/* Ending Title */}
        {isGood ? (
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-xl text-slate-100">
                Kara Kutu Açıldı
              </h1>
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            {/* Ending Reason / Narrative */}
            <p
              data-testid="ending-reason"
              className="font-body text-xs leading-relaxed text-slate-200 mt-2"
            >
              {reasonText}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-xl text-red-400">
                    Sistem Kurbanı
                  </h1>
                  <div className="font-mono text-[10px] text-slate-400">
                    // ACİL SERVİS / TELEMETRİ KONSOLU
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-mono text-[10px] font-bold">
                FATAL
              </span>
            </div>

            <div className="p-3 rounded bg-red-950/30 border border-red-500/30 space-y-1">
              <div className="font-mono text-[10px] text-red-400 font-bold uppercase tracking-wider">
                // NEDEN
              </div>
              <p
                data-testid="ending-reason"
                className="font-body text-xs leading-relaxed text-slate-200"
              >
                {reasonText}
              </p>
            </div>
          </div>
        )}

        {/* Telemetry row (Good ending only) */}
        {isGood && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            <div className="p-2 rounded bg-slate-950 border border-slate-850 text-center">
              <div className="font-mono text-[9px] text-slate-400">8 HASTA</div>
              <div className="font-mono text-[10px] font-bold text-sky-400 mt-0.5">
                ■ GÜVENDE
              </div>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-850 text-center">
              <div className="font-mono text-[9px] text-slate-400">SİSTEM</div>
              <div className="font-mono text-[10px] font-bold text-sky-400 mt-0.5">
                ■ MÜHÜRLENDİ
              </div>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-850 text-center">
              <div className="font-mono text-[9px] text-slate-400">KVKK</div>
              <div className="font-mono text-[10px] font-bold text-sky-400 mt-0.5">
                ■ SÜRESİNDE
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decisions Summary List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400">
          <span>// KARARLARIN // NÖBET KAYDI</span>
          <span>{isGood ? 'DENETİM ONAYLANDI' : 'DENETİM V3.4'}</span>
        </div>

        <div
          data-testid="decision-summary"
          className="space-y-2"
        >
          {decisionSummary.map((dec) => {
            const isFaulty = !isGood && !dec.isCorrectInGoodPath;
            return (
              <div
                key={dec.step}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                  isFaulty
                    ? 'bg-red-950/20 border-red-500/40 text-red-300'
                    : 'bg-slate-900/70 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      isFaulty
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {isFaulty ? (
                      <X className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  <div className="font-body text-xs font-semibold">
                    <span>{dec.label} – </span>
                    <span className="font-normal">{dec.choiceLabel}</span>
                  </div>
                </div>

                <span
                  className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                    isFaulty
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  {isFaulty ? 'KRİTİK HATA' : 'ONAY'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restart Button */}
      <div className="pt-2 space-y-2">
        <button
          data-testid="restart-btn"
          onClick={onRestart}
          className="w-full py-3.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>BAŞTAN OYNA</span>
        </button>

        <p className="text-center font-mono text-[10px] text-slate-500">
          KARA KUTU ARŞİV KİMLİĞİ: #KK-2026-{clock.replace(':', '')}-{isGood ? 'SUCCESS' : 'FAILURE'}
        </p>
      </div>
    </div>
  );
};
