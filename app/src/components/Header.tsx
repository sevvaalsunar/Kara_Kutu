/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Terminal, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { getRemainingTimeText } from '../story';

interface HeaderProps {
  clock: string;
  deadline?: string;
  isExpertLevel: boolean;
  countdown: number | null;
  statusTag?: string;
}

export const Header: React.FC<HeaderProps> = ({
  clock,
  deadline = '03:29',
  isExpertLevel,
  countdown,
  statusTag = 'ICU-09',
}) => {
  const timeLeft = getRemainingTimeText(clock);

  return (
    <header className="sticky top-0 z-50 bg-[#0A101D]/95 backdrop-blur border-b border-slate-800/80 px-4 py-3 select-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="hidden min-[400px]:inline whitespace-nowrap font-heading font-bold text-base tracking-wider text-slate-100 uppercase">
            KARA KUTU
          </span>
        </div>

        {/* Center / Game Clock & Countdown */}
        <div className="flex items-center gap-2">
          {/* Game Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 font-mono text-xs text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span data-testid="game-clock" className="font-semibold tracking-wider">
              {clock}
            </span>
            <span className="text-slate-500 text-[10px]">/</span>
            <span className="whitespace-nowrap text-slate-300 text-[11px] font-mono">
              Son: {deadline}
            </span>
            <span className="text-slate-500 text-[10px]">·</span>
            <span data-testid="time-left" className="whitespace-nowrap text-amber-400 font-mono text-[11px] font-medium">
              {timeLeft}
            </span>
          </div>

          {/* 60s Countdown for "Deneyimliyim" */}
          {isExpertLevel && countdown !== null && (
            <div
              data-testid="countdown"
              className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-xs font-bold border transition-colors ${
                countdown <= 10
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              }`}
              title="Kalan Karar Süresi"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{countdown}s</span>
            </div>
          )}
        </div>

        {/* Right Status Badge */}
        <div className="hidden min-[400px]:flex items-center gap-1.5">
          <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
            {statusTag}
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
        </div>
      </div>
    </header>
  );
};
