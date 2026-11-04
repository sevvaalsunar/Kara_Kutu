# Repo denetimi (v2.0 öncesi)

Tarih: 2026-11-04 · Kaynak: `github.com/sevvaalsunar/Kara_Kutu` @ `eb42075`

## Bulunan mimari

| Katman | Durum |
|---|---|
| Ön yüz | React 19 + TypeScript, Vite 8, Tailwind 4, `motion`, `lucide-react` (`app/src`) |
| Arka uç | Express (`app/server.ts`): Vite ara katmanı + `/api/tutor` (Gemini). GitHub Pages sürümünde arka uç yok; tutor yerel kural tabanlı cevaba düşer (`src/tutor.ts`). |
| Durum yönetimi | `App.tsx` içinde `useState`; ekran durumu `GIRIS → DECISION → RESULT → ENDING` |
| Hikâye | `src/story.ts`: 4 karar düğümü (`K1`, `K2_1A`, `K2_1B`, `K3`), 8 yol, 2 son. Kaynak: `spec.md` §3–§5 |
| Test | Cypress 16 (`app/cypress/e2e`): `yollar.cy.js` (8 yol + baştan oyna), `kabul.cy.js` (5 kabul örneği + kişiselleştirme + saat), `00-demo.cy.js`. Hepsi `?test=1` modunda. |
| Eval | `eval/` tutor ele verme değerlendirmesi (20 mesaj, 2 tur) |
| Dağıtım | `.github/workflows/deploy-pages.yml` → GitHub Pages, `base: './'` |
| Lint/build | `npm run lint` ve `npm run build` denetim anında temiz geçti |

## Kararlar

1. **Senaryo korunur.** KARA KUTU zaten özgün bir yazılım mühendisliği senaryosu (mimari, test, veri bütünlüğü, erişim kontrolü, KVKK). Yeni bir oyun yazmak yerine uyarlama katmanı mevcut oyunun içine eklenir; 8 yol, 2 son ve tüm `data-testid` sözleşmesi değişmez.
2. **Çıkarım tarayıcıda** (`onnxruntime-web`, WASM). skl2onnx'in ürettiği `Scaler` + `LinearClassifier` operatörlerinin ORT-web 1.30.0 WASM arka ucunda çalıştığı denetim sırasında doğrulandı.
3. **Model kararı izleyen ekranı değiştirir.** Her seçimden sonra çıkarım yapılır; olasılık eşiği geçerse sonuç ekranına kavram özeti eklenir, bir sonraki kararda tutor bağlamsal soruyla açılır ve "Deneyimliyim" sayacı 90 saniyeye uzar.
4. **Mevcut Cypress dosyaları taşınmaz** (`app/cypress`). Yeni testler aynı klasöre eklenir; repo kökünde ayrı bir `cypress/` açılmaz, çünkü iki Cypress kökü bakım yükü getirir.
5. **Veri toplama modu gölge modda çalışır.** Model olasılığı kaydedilir ama oyuna dokunmaz; böylece toplanan etiketler modelin kendi müdahalesiyle kirlenmez.

## Ortam kısıtları (bu çalışma ortamı)

- Cypress ikilisi (`download.cypress.io`) ve tarayıcı indirilemedi; Cypress testleri yazıldı ama burada koşturulamadı.
- `huggingface.co` ağ izin listesinde değil; yayın betiği hazırlandı, yayın yapılmadı.
- Gerçek kullanıcı oturumu yok; gerçek veri sayısı 0.
