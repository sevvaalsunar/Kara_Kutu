/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import { Choice, UserGoal, TIMEOUT_NOTE } from '../story';

interface ResultViewProps {
  choice: Choice;
  stepNumber: number;
  totalSteps?: number;
  goal: UserGoal;
  wasTimeout: boolean;
  onNext: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  choice,
  stepNumber,
  totalSteps = 3,
  goal,
  wasTimeout,
  onNext,
}) => {
  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-20">
      {/* Top Header Tag */}
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-sky-400 font-semibold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span>KARAR {stepNumber} · SONUÇ</span>
        </div>
        <div className="text-slate-400 font-semibold tracking-wider font-mono">
          {stepNumber}/{totalSteps} ADIM
        </div>
      </div>

      {/* Main Title Card */}
      <div className="space-y-1">
        <h1 className="font-heading font-bold text-xl text-slate-100 tracking-wide uppercase">
          UYGULAMA RAPORU
        </h1>
        <div className="font-mono text-[10px] text-slate-400">
          // OLAY KAYIT ID: #KK-904-REV{stepNumber}
        </div>
      </div>

      {/* Timeout Alert Note (Spec §4: "Karar vermedin; ICU-Net senin yerine karar verdi.") */}
      {wasTimeout && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              SÜRE DOLDU // OTOMATİK MÜDAHALE
            </div>
            <div
              data-testid="timeout-note"
              className="font-body text-xs font-semibold text-amber-200 mt-0.5"
            >
              {TIMEOUT_NOTE}
            </div>
          </div>
        </div>
      )}

      {/* Executed Protocol Badge */}
      <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>// YÜRÜTÜLEN MÜDAHALE PROTOKOLÜ</span>
          <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold">
            ■ TAMAMLANDI
          </span>
        </div>

        <div className="flex items-start gap-2.5 pt-1">
          <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-sky-400 shrink-0">
            {choice.key.toUpperCase()}
          </div>
          <div>
            <div className="font-heading font-bold text-sm text-slate-100">
              {choice.label}
            </div>
            <div className="font-body text-xs text-slate-400 mt-0.5">
              {choice.description}
            </div>
          </div>
        </div>
      </div>

      {/* "Ne oldu" Section */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>// SAHA ANALİZİ · FAZ 0{stepNumber}</span>
          <span className="text-sky-400 font-semibold">SYS.STAT: 200_OK</span>
        </div>

        <div>
          <h2 className="font-heading font-bold text-base text-sky-400 tracking-wide">
            Ne oldu
          </h2>
          <p
            data-testid="result-what"
            className="font-body text-xs leading-relaxed text-slate-200 mt-1.5"
          >
            {choice.what}
          </p>
        </div>
      </div>

      {/* "Neden oldu" Section */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>// KÖK NEDEN TESPİTİ</span>
          <span className="text-amber-400 font-semibold">DIAG.CODE: 0x88F</span>
        </div>

        <div>
          <h2 className="font-heading font-bold text-base text-amber-400 tracking-wide">
            Neden oldu
          </h2>
          <p
            data-testid="result-why"
            className="font-body text-xs leading-relaxed text-slate-200 mt-1.5"
          >
            {choice.why}
          </p>
        </div>

        {/* Concept Badge (Spec §4: ONLY shown when goal === 'learn') */}
        {goal === 'learn' && choice.concept && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div
              data-testid="result-concept"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-[11px] font-semibold tracking-wider"
            >
              <BookOpen className="w-3 h-3 text-sky-400" />
              <span>KAVRAM: {choice.concept.toUpperCase()}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              // ALTYAPI PROTOKOLÜ 4.2
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2 space-y-2">
        <button
          data-testid="next-btn"
          onClick={onNext}
          className="w-full py-3.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>DEVAM</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center font-mono text-[10px] text-slate-500">
          Sistem günlüğü güncellendi · Olay analizi kaydedildi
        </p>
      </div>
    </div>
  );
};
