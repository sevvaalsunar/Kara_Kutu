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
import {
  UserLevel,
  UserRole,
  UserGoal,
  Choice,
  DecisionNode,
  DECISIONS,
} from './story';

type ScreenState = 'GIRIS' | 'DECISION' | 'RESULT' | 'ENDING';

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

  // Countdown timer for "Deneyimliyim" (60 seconds)
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      setWasTimeout(isAutomaticTimeout);
      setLastChoice(choice);
      const newPath = [...selectedPath, choice.id];
      setSelectedPath(newPath);

      // Advance clock based on decision choice
      setGameClock(choice.nextClock);

      // Move to Result screen (S1, S2, or S3)
      setScreen('RESULT');
    },
    [clearDecisionTimer, selectedPath]
  );

  // Setup countdown timer when entering DECISION screen if level is expert
  useEffect(() => {
    if (screen === 'DECISION' && level === 'expert') {
      setCountdown(60);
      clearDecisionTimer();

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return 60;
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
          />
        )}

        {screen === 'DECISION' && currentDecision && (
          <DecisionView
            decision={currentDecision}
            level={level || 'new'}
            role={role || 'ops'}
            isTestMode={isTestMode}
            onSelectChoice={(choice) => handleSelectChoice(choice, false)}
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
          />
        )}

        {screen === 'ENDING' && (
          <EndingView
            path={selectedPath}
            clock={gameClock}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
