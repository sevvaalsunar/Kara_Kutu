/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { GirisView } from './components/GirisView';
import { DecisionView } from './components/DecisionView';
import { ResultView } from './components/ResultView';
import { EndingView } from './components/EndingView';
import { DebugPanel, LastPrediction } from './components/DebugPanel';
import { SessionLog } from './ml/telemetry';
import { computeFeatures, LEVEL_TO_DIFFICULTY, FeatureVector } from './ml/features';
import { loadModel, predict, getModelState, subscribeModel, ModelState } from './ml/modelRuntime';
import { decideRollout } from './ml/rollout';
import { SUPPORT_COUNTDOWN_SECONDS, STANDARD_COUNTDOWN_SECONDS } from './ml/adaptive';
import {
  UserLevel,
  UserRole,
  UserGoal,
  Choice,
  DecisionNode,
  DECISIONS,
} from './story';

type ScreenState = 'GIRIS' | 'DECISION' | 'RESULT' | 'ENDING';

const PARAMS = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
const DEBUG = PARAMS.get('debug') === '1';
const DATA_MODE = PARAMS.get('veri') === '1';
const MODEL_OFF = PARAMS.get('model') === 'off';
const MODEL_BROKEN = PARAMS.get('model') === 'bozuk';

export default function App() {
  // Player Configuration (§4: no option preselected)
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [goal, setGoal] = useState<UserGoal | null>(null);

  // Test mode: ?test=1
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test') === '1') {
        setIsTestMode(true);
      }
    }
  }, []);

  // Flow & State Machine
  const [screen, setScreen] = useState<ScreenState>('GIRIS');
  const [currentDecisionKey, setCurrentDecisionKey] = useState<string>('K1');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [wasTimeout, setWasTimeout] = useState<boolean>(false);
  const [stepNumber, setStepNumber] = useState<number>(1);

  // In-Game Clock (§3)
  const [gameClock, setGameClock] = useState<string>('03:14');

  // Countdown timer for "Deneyimliyim" (60 seconds; 90 when adaptive support is active, spec §14)
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // v2.0: anonim oturum kaydı, model ve uyarlama (spec §11–§20)
  const logRef = useRef<SessionLog>(new SessionLog());
  const gameNoRef = useRef(1);
  const decisionStartRef = useRef(Date.now());
  const hesitationRef = useRef(0);
  const hintUsedRef = useRef(false);
  const [decisionCount, setDecisionCount] = useState(0);
  const [consent, setConsent] = useState(false);
  const [modelState, setModelState] = useState<ModelState>(getModelState());
  const [lastPrediction, setLastPrediction] = useState<LastPrediction | null>(null);
  // Sonuç ekranındaki kavram özeti: hangi kararın (indeks) sonucunda gösterileceği
  const [recapIndex, setRecapIndex] = useState<number | null>(null);
  // Bir sonraki karar ekranında destek verilecek mi
  const [supportNext, setSupportNext] = useState(false);
  const supportNextRef = useRef(false);
  const currentIndexRef = useRef(-1);

  useEffect(() => {
    const unsubscribe = subscribeModel(setModelState);
    return () => {
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!MODEL_OFF) loadModel({ broken: MODEL_BROKEN });
  }, []);

  const rollout = decideRollout({
    params: PARAMS,
    sessionId: logRef.current.id,
    releaseStatus: modelState.config?.release_status ?? null,
    configMode: modelState.config?.rollout.mode ?? null,
    canaryPercent: modelState.config?.rollout.canary_percent ?? 0,
  });
  const rolloutRef = useRef(rollout);
  rolloutRef.current = rollout;

  const setSupport = (v: boolean) => {
    supportNextRef.current = v;
    setSupportNext(v);
  };

  /** Karar kaydedildikten sonra çıkarım yapar; eşik geçilir ve kol "on" ise uyarlamayı açar. */
  const runInference = useCallback(async (index: number, sahne: string) => {
    const r = rolloutRef.current;
    const st = getModelState();
    if (r.mode === 'off' || st.status !== 'hazir' || !st.config) return;
    let features: FeatureVector | null = null;
    try {
      features = computeFeatures(logRef.current.events, index);
      const { p, ms } = await predict(features);
      logRef.current.setModelP(index, p);
      const applied = r.mode === 'on' && p >= st.config.support_threshold;
      setLastPrediction({ index, sahne, p, ms, applied, features, error: null });
      if (applied) {
        if (currentIndexRef.current === index) setRecapIndex(index);
        setSupport(true);
      }
    } catch (err) {
      // spec §18: çıkarım hatasında uyarlama yok, oyun devam eder
      setLastPrediction({
        index, sahne, p: null, ms: null, applied: false,
        features: features ?? ({} as FeatureVector),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  // Test ve debug için gerçek modele erişim (parite testleri; sahte olasılık yok)
  useEffect(() => {
    if (!(DEBUG || PARAMS.get('test') === '1')) return;
    (window as any).__KK_MODEL__ = {
      state: () => getModelState(),
      predict: async (f: FeatureVector) => {
        const { p } = await predict(f);
        setLastPrediction({ index: -1, sahne: 'parite', p, ms: null, applied: false, features: f, error: null });
        return p;
      },
    };
  }, []);

  const clearDecisionTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handler for user decision selection
  const handleSelectChoice = useCallback(
    (choice: Choice, isAutomaticTimeout: boolean = false) => {
      clearDecisionTimer();
      // v2.0: kararı anonim olarak kaydet (spec §13, §15)
      const index = logRef.current.add({
        sahne_id: currentDecisionKey,
        secim_id: choice.id,
        zaman_asimi: isAutomaticTimeout,
        decision_time_sec: Math.round(((Date.now() - decisionStartRef.current) / 1000) * 100) / 100,
        hesitation_count: hesitationRef.current,
        ipucu_kullandi: hintUsedRef.current,
        oyun_no: gameNoRef.current,
        difficulty_level: LEVEL_TO_DIFFICULTY[level ?? 'new'],
        destek_verildi: supportNextRef.current,
      });
      currentIndexRef.current = index;
      setDecisionCount(index + 1);
      setRecapIndex(null);
      setSupport(false);
      runInference(index, currentDecisionKey);
      setWasTimeout(isAutomaticTimeout);
      setLastChoice(choice);
      const newPath = [...selectedPath, choice.id];
      setSelectedPath(newPath);

      // Advance clock based on decision choice
      setGameClock(choice.nextClock);

      // Move to Result screen (S1, S2, or S3)
      setScreen('RESULT');
    },
    [clearDecisionTimer, selectedPath, currentDecisionKey, level, runInference]
  );

  // Setup countdown timer when entering DECISION screen if level is expert
  useEffect(() => {
    if (screen === 'DECISION') {
      decisionStartRef.current = Date.now();
      hesitationRef.current = 0;
      hintUsedRef.current = false;
    }
    if (screen === 'DECISION' && level === 'expert') {
      setCountdown(supportNextRef.current ? SUPPORT_COUNTDOWN_SECONDS : STANDARD_COUNTDOWN_SECONDS);
      clearDecisionTimer();

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return STANDARD_COUNTDOWN_SECONDS;
          return Math.max(prev - 1, 0);
        });
      }, 1000);
    } else {
      setCountdown(null);
      clearDecisionTimer();
    }

    return () => clearDecisionTimer();
  }, [screen, level, currentDecisionKey, clearDecisionTimer]);

  // Timeout triggered! Pick ICU-Net default choice for this node.
  // Kept out of the state updater so it runs after commit, not during render.
  useEffect(() => {
    if (screen === 'DECISION' && countdown === 0) {
      const node = DECISIONS[currentDecisionKey];
      const timeoutChoice =
        node.choiceA.id === node.timeoutChoiceId
          ? node.choiceA
          : node.choiceB;
      handleSelectChoice(timeoutChoice, true);
    }
  }, [screen, countdown, currentDecisionKey, handleSelectChoice]);

  // Start game from Giriş
  const handleStartGame = () => {
    if (!level || !role || !goal) return;
    if (DATA_MODE && !consent) return;
    setSelectedPath([]);
    setLastChoice(null);
    setWasTimeout(false);
    setStepNumber(1);
    setCurrentDecisionKey('K1');
    setGameClock(DECISIONS.K1.clock); // '03:15'
    setScreen('DECISION');
  };

  // Proceed from Result screen to next decision or ending
  const handleNextFromResult = () => {
    if (stepNumber === 1) {
      // From Karar 1 to Karar 2
      const nextKey = selectedPath[0] === '1A' ? 'K2_1A' : 'K2_1B';
      setCurrentDecisionKey(nextKey);
      setStepNumber(2);
      setGameClock('03:18');
      setScreen('DECISION');
    } else if (stepNumber === 2) {
      // From Karar 2 to Karar 3
      setCurrentDecisionKey('K3');
      setStepNumber(3);
      setGameClock('03:24');
      setScreen('DECISION');
    } else {
      // From Karar 3 to Ending screen
      // Clock is already set to 03:28 (if Karar 3 choice was A) or 03:26 (if choice was B)
      setScreen('ENDING');
    }
  };

  // Restart game
  const handleRestart = () => {
    clearDecisionTimer();
    gameNoRef.current += 1; // aynı oturum, yeni oyun (retry_count)
    setRecapIndex(null);
    setScreen('GIRIS');
    setSelectedPath([]);
    setLastChoice(null);
    setWasTimeout(false);
    setStepNumber(1);
    setCurrentDecisionKey('K1');
    setGameClock('03:14');
    setLevel(null);
    setRole(null);
    setGoal(null);
  };

  const currentDecision = DECISIONS[currentDecisionKey];

  return (
    <div className="min-h-screen bg-[#0A101D] text-slate-100 flex flex-col font-body">
      {/* Top Header with game-clock, Son: 03:29, time-left, countdown, etc. */}
      <Header
        clock={gameClock}
        deadline="03:29"
        isExpertLevel={level === 'expert'}
        countdown={countdown}
        statusTag={
          screen === 'ENDING'
            ? selectedPath.join(' -> ') === '1B -> 2B1 -> A'
              ? 'ÇÖZÜLDÜ'
              : 'İHLAL EDİLDİ'
            : stepNumber > 1
            ? `NÖBET-0${stepNumber}`
            : 'ICU-09'
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start">
        {screen === 'GIRIS' && (
          <GirisView
            level={level}
            role={role}
            goal={goal}
            setLevel={setLevel}
            setRole={setRole}
            setGoal={setGoal}
            onStart={handleStartGame}
            requireConsent={DATA_MODE}
            consent={consent}
            setConsent={setConsent}
          />
        )}

        {screen === 'DECISION' && currentDecision && (
          <DecisionView
            decision={currentDecision}
            level={level || 'new'}
            role={role || 'ops'}
            isTestMode={isTestMode}
            onSelectChoice={(choice) => handleSelectChoice(choice, false)}
            adaptiveSupport={supportNext}
            onHesitation={() => {
              hesitationRef.current += 1;
            }}
            onHintUsed={() => {
              hintUsedRef.current = true;
            }}
          />
        )}

        {screen === 'RESULT' && lastChoice && (
          <ResultView
            choice={lastChoice}
            stepNumber={stepNumber}
            totalSteps={3}
            goal={goal || 'learn'}
            wasTimeout={wasTimeout}
            onNext={handleNextFromResult}
            adaptiveRecap={recapIndex !== null && recapIndex === currentIndexRef.current}
          />
        )}

        {screen === 'ENDING' && (
          <EndingView
            path={selectedPath}
            clock={gameClock}
            onRestart={handleRestart}
            onExport={DATA_MODE ? () => logRef.current.download() : undefined}
          />
        )}
      </main>

      {DEBUG && (
        <DebugPanel
          model={modelState}
          rollout={rollout}
          last={lastPrediction}
          sessionId={logRef.current.id}
          decisions={decisionCount}
          onExport={() => logRef.current.download()}
        />
      )}
    </div>
  );
}
