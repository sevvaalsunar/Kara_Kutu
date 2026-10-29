/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Shield, Server, Code, Lock, CheckSquare, Square, ArrowRight } from 'lucide-react';
import { UserLevel, UserRole, UserGoal, INITIAL_BRIEFING } from '../story';

interface GirisViewProps {
  level: UserLevel | null;
  role: UserRole | null;
  goal: UserGoal | null;
  setLevel: (lvl: UserLevel) => void;
  setRole: (r: UserRole) => void;
  setGoal: (g: UserGoal) => void;
  onStart: () => void;
}

export const GirisView: React.FC<GirisViewProps> = ({
  level,
  role,
  goal,
  setLevel,
  setRole,
  setGoal,
  onStart,
}) => {
  const roleText = role
    ? INITIAL_BRIEFING.roleDescriptions[role]
    : INITIAL_BRIEFING.roleDescriptions.default;

  const isReady = Boolean(level && role && goal);

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-20">
      {/* Alert banner */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>ICU-NET // PROTOKOL 404 - AKTİF TEHDİT</span>
        </div>
        <span className="text-amber-500/80 font-semibold">SYS.REC</span>
      </div>

      {/* Briefing Card */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-10">
          <ShieldAlert className="w-full h-full text-sky-400" />
        </div>

        <div>
          <h1 className="font-heading font-bold text-xl text-slate-100 tracking-wide">
            KARA KUTU
          </h1>
          <p className="font-mono text-xs text-sky-400 mt-0.5">
            03:14 · ICU-Net'e bağlı 300 hasta. Nöbetçi sensin.
          </p>
        </div>

        <p className="font-body text-xs leading-relaxed text-slate-300">
          Saat 03:14. Şehrin en büyük hastanesinde yeni devreye alınan yapay zekâ destekli yoğun bakım ağı ICU-Net çökmedi; tam tersine, yanlış kararlar vererek çalışmaya devam ediyor. ICU-Net'e bağlı 300 hastanın solunum cihazı ve ilaç pompaları kaynağı belirsiz, şifreli komutlar alıyor. Başhekim arıyor; siber güvenlik ekibine ulaşılamıyor. 15 dakika içinde, yani 03:29'a kadar müdahale edilmezse dozaj hataları ölümcül olacak.{' '}
          <span className="text-sky-300 font-semibold">{roleText}</span>
        </p>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
            <div className="font-mono text-[10px] text-slate-400 flex items-center justify-between">
              <span>ICU-Net</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="font-mono text-xs font-bold text-amber-400 mt-1">
              Çalışıyor
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              yanlış komutlar
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
            <div className="font-mono text-[10px] text-slate-400 flex items-center justify-between">
              <span>Son tarih</span>
              <span className="text-sky-400 font-mono text-[10px]">15 dk kaldı</span>
            </div>
            <div className="font-mono text-xs font-bold text-sky-400 mt-1">
              03:29
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              kritik eşik
            </div>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/60">
          <span>DÜĞÜM: HASTANE_OMURGA_TR</span>
          <span className="text-amber-500/90 font-semibold">[TETİKTE]</span>
        </div>
      </div>

      {/* 3 Questions Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-slate-400 tracking-wider">
          <span>GÖREV YETKİLENDİRME PANELİ</span>
          <span className="text-sky-400">// ADIM 01-03</span>
        </div>

        {/* Question 1: Seviye */}
        <div className="space-y-2">
          <div className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="text-sky-400">■</span> SEVİYEN
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'new', testId: 'level-new', label: 'Yeni başladım', sub: 'Tutor ipuçları açık, süre sınırı yok' },
              { id: 'mid', testId: 'level-mid', label: 'Biraz deneyimim var', sub: 'İpuçları butonla açılır, süre sınırı yok' },
              { id: 'expert', testId: 'level-expert', label: 'Deneyimliyim', sub: 'Butonla ipucu, 60s geri sayım ve ICU-Net timeout' },
            ].map((item) => {
              const isSelected = level === item.id;
              return (
                <button
                  key={item.id}
                  data-testid={item.testId}
                  onClick={() => setLevel(item.id as UserLevel)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-400 shadow-sm shadow-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-body font-semibold text-xs text-slate-100">
                        {item.label}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/40">
                      SEÇİLDİ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 2: Rol */}
        <div className="space-y-2">
          <div className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="text-sky-400">■</span> ROLÜN
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'dev', testId: 'role-dev', label: 'Yazılım geliştirici', icon: Code },
              { id: 'ops', testId: 'role-ops', label: 'Sistem-DevOps', icon: Server },
              { id: 'sec', testId: 'role-sec', label: 'Güvenlik', icon: Lock },
            ].map((item) => {
              const isSelected = role === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  data-testid={item.testId}
                  onClick={() => setRole(item.id as UserRole)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-400 shadow-sm shadow-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div className="font-body font-semibold text-xs text-slate-100 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/40">
                      SEÇİLDİ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 3: Hedef */}
        <div className="space-y-2">
          <div className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="text-sky-400">■</span> HEDEFİN
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'learn', testId: 'goal-learn', label: 'Kavramları öğrenmek', sub: 'Sonuç ekranlarında yazılım mühendisliği kavram etiketleri gösterilir' },
              { id: 'test', testId: 'goal-test', label: 'Kendimi sınamak', sub: 'Kavram etiketleri gizlenir, saf kriz müdahalesi' },
            ].map((item) => {
              const isSelected = goal === item.id;
              return (
                <button
                  key={item.id}
                  data-testid={item.testId}
                  onClick={() => setGoal(item.id as UserGoal)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-400 shadow-sm shadow-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-body font-semibold text-xs text-slate-100">
                        {item.label}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/40">
                      SEÇİLDİ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start Button & System Note */}
      <div className="pt-2 space-y-2">
        <button
          data-testid="start-btn"
          onClick={onStart}
          disabled={!isReady}
          className={`w-full py-3.5 px-4 rounded-lg font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${
            isReady
              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20 active:scale-[0.99] cursor-pointer'
              : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>NÖBETİ DEVRAL</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center font-mono text-[10px] text-slate-500">
          • Sistem günlüğü kaydediliyor. Geri dönüş yoktur.
        </p>
      </div>
    </div>
  );
};
