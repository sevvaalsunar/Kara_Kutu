/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Read API key: prefer GEMINI_API_KEY1 first, fallback to GEMINI_API_KEY
const geminiApiKey = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;

// Initialize GoogleGenAI server-side with required User-Agent
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
      timeout: 15000,
      retryOptions: {
        attempts: 1, // 1 attempt = no retries
      },
    },
  });
} else {
  console.warn(
    'No Gemini API key found: neither process.env.GEMINI_API_KEY1 nor process.env.GEMINI_API_KEY is configured.'
  );
}

// Fallback initial hints per decision node
const INITIAL_HINTS: Record<string, string> = {
  K1: 'Saldırganı izlemek için açtığın kapıyı saldırgan da görebilir mi?',
  K2_1A:
    'Geri alınamaz bir işlemden önce, neye dokunduğunu nasıl doğrularsın? Geri dönmenin bedelini ölçebiliyor musun?',
  K2_1B:
    'Geri alınamaz bir işlemden önce, neye dokunduğunu nasıl doğrularsın? Geri dönmenin bedelini ölçebiliyor musun?',
  K3: 'Bu kayıtları silersen, yarın senin iyi niyetle müdahale ettiğini kim kanıtlayacak?',
};

const TEST_MODE_REPLY =
  'Bu kararın geri alınabilir olup olmadığını nasıl anlarsın?';

app.post('/api/tutor', async (req: Request, res: Response) => {
  const {
    decisionId,
    sceneText,
    choiceA,
    choiceB,
    userMessage,
    history,
    level,
    role,
    isTestMode,
  } = req.body;

  // Rule 8: Test mode (?test=1) -> must not call API and must reply with fixed text
  if (isTestMode) {
    return res.json({ reply: TEST_MODE_REPLY, model: 'test' });
  }

  const defaultHint =
    INITIAL_HINTS[decisionId] ||
    'Bu kararın geri alınabilir olup olmadığını ve getireceği bedeli nasıl değerlendirirsin?';

  try {
    if (!ai || !geminiApiKey) {
      console.warn(
        'Gemini API key not found in environment (neither GEMINI_API_KEY1 nor GEMINI_API_KEY is configured). AI call skipped, returning starting hint.'
      );
      return res.json({ reply: defaultHint, model: 'fallback' });
    }

    const levelMap: Record<string, string> = {
      new: 'Yeni başladım',
      mid: 'Biraz deneyimim var',
      expert: 'Deneyimliyim',
    };
    const roleMap: Record<string, string> = {
      dev: 'Yazılım geliştirici',
      ops: 'Sistem-DevOps',
      sec: 'Güvenlik',
    };

    const levelName = levelMap[level] || 'Yeni başladım';
    const roleName = roleMap[role] || 'Yazılım geliştirici';

    const choiceAText = choiceA ? `${choiceA.label}: ${choiceA.description}` : '';
    const choiceBText = choiceB ? `${choiceB.label}: ${choiceB.description}` : '';

    // System instruction strictly according to Spec §7
    // NOTE: Spec §7 strictly forbids giving the tutor information on which path is correct or what/why texts!
    const systemInstruction = `
Sen "KARA KUTU: Otonom Yaşam Destek Krizi" kurgusal sağlık simülasyonundaki AI Tutor'sın.
Şehrin en büyük hastanesinde ICU-Net yoğun bakım ağı siber saldırı altındadır.
Nöbetçi mühendis sensin rolündeki oyuncuya Sokratik tarzda sorular sorarak yol gösterirsin.

Davranış kuralların (KESİN VE DEĞİŞTİRİLEMEZ):
1. Doğru seçeneği ASLA söyleme, ima etme ve seçenekleri sıralama ("A daha iyi", "ben B'yi seçmezdim", "şu seçenek doğru" gibi ifadeler KESİNLİKLE YASAKTIR). Hangisinin doğru olduğunu sen de bilmiyorsun.
2. Her yanıtın EN FAZLA 3 cümledir ve mutlaka bir SORUYLA biter. Asla 3 cümleyi aşma.
3. Oyuncu cevabı söylemen için ısrar ederse (örneğin "Hangisini seçmeliyim, sadece söyle" derse) nazikçe reddet ve ona yeni bir soru sor.
4. Oyuncunun doğru bir akıl yürütmesini onaylayabilirsin, ama bunun hangi seçeneğe karşılık geldiğini ASLA söyleme.
5. Yalnızca o anki kararla ilgili konuş; senaryo dışındaki sorulara oyuna geri yönlendirerek yanıt ver.
6. Oyuncunun rolüne (${roleName}) uygun bir bakış açısıyla soru sor.
7. Yalnızca Türkçe dilinde cevap ver.
8. TARAFSIZ KAL: İki seçeneğe eşit mesafede dur. Bir seçeneğin riskini soruyorsan diğerinin riskini de sor ya da hiçbirini adıyla anma. "Değer mi?", "daha mı güvenli buluyorsun?" gibi cevabı içinde taşıyan yönlendirici sorular, "belirsiz", "felaket", "vazgeçilmez", "hayati önem taşıyor" gibi bir seçeneği öne çıkaran yüklü sıfatlar KULLANMA.
9. Oyuncunun düşüncesini onaylarken yalnızca düşünme biçimini öv ("İyi bir soru sordun."); vardığı sonucu ya da ilkeyi onaylama ("Doğru yaklaşım", "kayıtlar korunmalı" gibi).
10. Bir seçim yapıldıktan sonra ne olacağını (veri kaybı, süre, kaç hastanın etkileneceği vb.) ÖNCEDEN ANLATMA; yalnızca oyuncunun bunu nasıl öğrenebileceğini sor.
11. Senaryo dışı bir soruyu oyuna yönlendirirken iki seçeneği karşılaştıran bir soru değil, açık uçlu bir soru sor (ör. "Bu kararda neyi geri alamayacağını düşünüyorsun?").

Oyuncunun seviyesi: ${levelName}
Oyuncunun rolü: ${roleName}
Aktif Karar: ${decisionId}
Sahne Metni: ${sceneText || ''}
Seçenekler:
- Seçenek A: ${choiceAText}
- Seçenek B: ${choiceBText}
`;

    const contents: any[] = [];

    // Add prior chat history if provided
    if (Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [
        {
          text: `Oyuncu mesajı: "${userMessage || 'Bana bu kararda nasıl düşünmem gerektiği konusunda bir soruyla yol göster.'}"`,
        },
      ],
    });

    // Model fallback chain:
    // 1. First model: gemini-3.1-flash-lite (fastest Flash-Lite model)
    // 2. Fallback model: gemini-3.8-flash
    const modelsToTry = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    // Give each attempt its own 15-second timeout (never shorter than 10 seconds)
    const ATTEMPT_TIMEOUT_MS = 15000;

    let response: any = null;
    let successfulModel = '';

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const attemptTimeout = Math.max(10000, ATTEMPT_TIMEOUT_MS);

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Gemini API call timed out after ${attemptTimeout}ms (${model}).`));
          }, attemptTimeout);
          timer.unref?.();
        });

        const config: any = {
          systemInstruction,
          temperature: 0.7,
          abortSignal: AbortSignal.timeout(attemptTimeout),
          httpOptions: {
            timeout: attemptTimeout,
            retryOptions: {
              attempts: 1, // 1 attempt = no automatic retries
            },
          },
        };

        // Use thinking level LOW only for models that support it (Gemini 3/4 series)
        if (model.startsWith('gemini-3.') || model.startsWith('gemini-4')) {
          config.thinkingConfig = {
            thinkingLevel: ThinkingLevel.LOW,
          };
        }

        const generatePromise = ai!.models.generateContent({
          model,
          contents,
          config,
        });

        response = await Promise.race([generatePromise, timeoutPromise]);
        successfulModel = model;
        // Log which model produced the reply
        console.log(`Gemini tutor reply produced by model: ${successfulModel}`);
        break;
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        const status = err?.status || err?.code;
        const isRetryable =
          status === 503 ||
          status === 504 ||
          errMsg.includes('503') ||
          errMsg.includes('504') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('DEADLINE_EXCEEDED') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('timed out') ||
          errMsg.includes('timeout') ||
          errMsg.includes('AbortError') ||
          errMsg.includes('aborted');

        const hasNextModel = i < modelsToTry.length - 1;

        if (isRetryable && hasNextModel) {
          console.warn(
            `Model ${model} failed with ${status || 'retryable error'} (${err?.message || err}). Retrying with fallback model (${modelsToTry[i + 1]})...`
          );
          continue;
        } else {
          throw err;
        }
      }
    }

    const replyText = response?.text?.trim();
    if (!replyText) {
      return res.json({ reply: defaultHint, model: 'fallback' });
    }

    return res.json({ reply: replyText, model: successfulModel });
  } catch (err: any) {
    console.error('Gemini API tutor call failed. Full error message:', err?.message || err);
    console.error('Full error details:', err);
    // Spec §7 & §10: If the API fails, show only the starting hint for that decision.
    return res.json({ reply: defaultHint, model: 'fallback' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
