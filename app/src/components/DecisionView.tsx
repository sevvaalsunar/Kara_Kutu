/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bot, ChevronDown, ChevronUp, Send, Loader2, AlertCircle } from 'lucide-react';
import { DecisionNode, Choice, UserLevel, UserRole } from '../story';
import { getLocalTutorReply } from '../tutor';

interface DecisionViewProps {
  decision: DecisionNode;
  level: UserLevel;
  role: UserRole;
  isTestMode: boolean;
  onSelectChoice: (choice: Choice) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const DecisionView: React.FC<DecisionViewProps> = ({
  decision,
  level,
  role,
  isTestMode,
  onSelectChoice,
}) => {
  // Spec §4: "Yeni başladım": tutor ipucu kutusu otomatik açık gelir.
  // "Biraz deneyimim var" & "Deneyimliyim": ipucu butonla açılır.
  const [isHintOpen, setIsHintOpen] = useState(level === 'new');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: decision.initialHint },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset or update tutor hint when decision changes
  useEffect(() => {
    setIsHintOpen(level === 'new');
    setMessages([{ role: 'model', text: decision.initialHint }]);
    setInputText('');
  }, [decision.id, level]);

  const handleSendTutor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMsg = trimmed;
    setInputText('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    // Rule 8: Test mode (?test=1) -> reply with fixed text immediately without calling API
    if (isTestMode) {
      setTimeout(() => {
        setMessages([
          ...newMessages,
          {
            role: 'model',
            text: 'Bu kararın geri alınabilir olup olmadığını nasıl anlarsın?',
          },
        ]);
        setIsLoading(false);
      }, 100);
      return;
    }

    const isStaticHost =
      typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('.github.io') ||
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' && window.location.port === '');

    if (isStaticHost) {
      setMessages([
        ...newMessages,
        { role: 'model', text: getLocalTutorReply(decision, userMsg) },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionId: decision.id,
          sceneText: decision.sceneText,
          choiceA: {
            label: decision.choiceA.label,
            description: decision.choiceA.description,
          },
          choiceB: {
            label: decision.choiceB.label,
            description: decision.choiceB.description,
          },
          userMessage: userMsg,
          history: newMessages.slice(0, -1),
          level,
          role,
          isTestMode: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      // Sunucuda API anahtarı yoksa veya Gemini hata verdiyse sunucu hep aynı başlangıç ipucunu döner;
      // bu durumda yerel tutor cevabını kullan.
      const reply =
        data.model === 'fallback' || !data.reply
          ? getLocalTutorReply(decision, userMsg)
          : data.reply;

      setMessages([...newMessages, { role: 'model', text: reply }]);
    } catch (err) {
      console.error('Tutor fetch error:', err);
      setMessages([
        ...newMessages,
        { role: 'model', text: getLocalTutorReply(decision, userMsg) },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-20">
      {/* Step and Category Tag */}
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-sky-400 font-semibold tracking-wider uppercase">
          {decision.tag}
        </div>
        <div className="text-slate-400 font-semibold tracking-wider">
          {decision.step}
        </div>
      </div>

      {/* Scene Card */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 relative">
        <div className="flex items-start justify-between">
          <h2
            data-testid="scene-title"
            className="font-heading font-bold text-base text-slate-100 leading-snug"
          >
            {decision.title}
          </h2>
          <span className="w-2 h-2 rounded bg-red-500/80 shrink-0 mt-1" />
        </div>

        <p
          data-testid="scene-text"
          className="font-body text-sm leading-relaxed text-slate-200"
        >
          {decision.sceneText}
        </p>

        {/* Telemetry context line */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 font-mono text-[10px] text-slate-400">
          <span>DÜĞÜM: HASTANE_OMURGA_TR</span>
          <span>ETKİLENEN HASTA: 300</span>
          <span className="text-amber-400 font-semibold">RİSK: YÜKSEK</span>
        </div>
      </div>

      {/* Choices Cards */}
      {/* Rule: In decision screen both option cards look identical, neither is highlighted, no risk badges */}
      <div className="space-y-3">
        {/* Choice A */}
        <button
          data-testid="choice-a"
          onClick={() => onSelectChoice(decision.choiceA)}
          className="w-full text-left p-4 rounded-lg bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-sky-400 shrink-0 group-hover:border-sky-400 group-hover:bg-sky-500/10">
              A
            </div>
            <div className="space-y-1 min-w-0">
              <div className="font-heading font-bold text-sm text-slate-100 group-hover:text-sky-300">
                {decision.choiceA.label}
              </div>
              <div className="font-body text-xs text-slate-300 leading-relaxed">
                {decision.choiceA.description}
              </div>
            </div>
          </div>
        </button>

        {/* Choice B */}
        <button
          data-testid="choice-b"
          onClick={() => onSelectChoice(decision.choiceB)}
          className="w-full text-left p-4 rounded-lg bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-sky-400 shrink-0 group-hover:border-sky-400 group-hover:bg-sky-500/10">
              B
            </div>
            <div className="space-y-1 min-w-0">
              <div className="font-heading font-bold text-sm text-slate-100 group-hover:text-sky-300">
                {decision.choiceB.label}
              </div>
              <div className="font-body text-xs text-slate-300 leading-relaxed">
                {decision.choiceB.description}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Tutor / İpucu Panel */}
      <div className="rounded-lg bg-slate-950 border border-slate-800/90 overflow-hidden shadow-lg">
        {/* Toggle Header / Button */}
        <button
          data-testid="hint-btn"
          onClick={() => setIsHintOpen(!isHintOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 font-mono text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-sky-400">
            <Bot className="w-4 h-4" />
            <span className="font-bold tracking-wider">TUTOR // İPUCU</span>
            <span className="px-1.5 py-0.2 rounded bg-sky-500/10 border border-sky-500/30 text-[10px] text-sky-300 font-semibold">
              AKTİF
            </span>
          </div>
          <div className="text-slate-400 flex items-center gap-1">
            <span className="text-[11px]">{isHintOpen ? 'Gizle' : 'Aç'}</span>
            {isHintOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {/* Collapsible Tutor Content */}
        {isHintOpen && (
          <div data-testid="hint-box" className="p-3.5 space-y-3 bg-slate-950/80">
            {/* Conversation Flow */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'model' && (
                    <div className="w-6 h-6 rounded bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] p-2.5 rounded text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sky-600/30 border border-sky-500/40 text-slate-100 font-body'
                        : 'bg-slate-900 border border-slate-800 text-slate-200'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="font-mono text-[10px] text-sky-400 font-bold mb-1 tracking-wider uppercase">
                        TUTOR AI // REHBER
                      </div>
                    )}
                    {/* Tutor reply element with exact test hook */}
                    <div
                      {...(msg.role === 'model' ? { 'data-testid': 'tutor-reply' } : {})}
                      className="italic font-body"
                    >
                      "{msg.text}"
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-sky-400 font-mono py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Tutor analiz ediyor…</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendTutor} className="flex gap-2 pt-1 border-t border-slate-800/80">
              <input
                data-testid="tutor-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tutor'a sor…"
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-body"
              />
              <button
                data-testid="tutor-send"
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs rounded flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>GÖNDER</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* System Note */}
      <p className="text-center font-mono text-[10px] text-slate-500 pt-1">
        Sistem günlüğü kaydediliyor. Seçim geri alınamaz.
      </p>
    </div>
  );
};
