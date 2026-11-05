# Son aşama başlangıç denetimi

Tarih: 2026-11-04 · Bu belge, "son tamamlama ve doğrulama" aşamasının **başındaki** durumu kaydeder. Sonuçlar: [`FINAL_REPORT.md`](FINAL_REPORT.md).

## Repo durumu

| | |
|---|---|
| Konum | Çalışma ortamındaki asıl repo (`Kara_Kutu/`); zip ve patch bu repodan üretilmişti |
| Dal / HEAD | `main` @ `f21e133`; çalışma ağacı temiz |
| v2.0 commit'leri | `6ffaaeb` (spec + eğitim ayarları, eğitimden önce), `3893dd6` (v2.0), `f21e133` (önbellek yoksayma) |
| Etiketler | Yok. `v2.0` etiketi bilerek oluşturulmadı: model kabul edilmedi. |
| Patch | Zaten uygulanmış hâl; tekrar uygulanmadı |

## Mevcut işlevsellik

- v1 oyunu: 8 yol, 2 son, tutor, kişiselleştirme.
- v2.0 katmanı: özellik hesaplama, ORT-web çıkarımı, dağıtım kolları, veri toplama modu, debug paneli.
- Veri ve eğitim hattı, Python Oracle, yayın betiği.

## Mevcut test sonuçları (aşama başında)

| Test | Durum |
|---|---|
| pytest | 31/31 geçti |
| `tsc --noEmit`, `vite build` | Geçti |
| Node üzerinde ORT-web paritesi | 5/5, fark 0 |
| Cypress (v1 + v2.0) | **Hiç koşturulmadı**: Cypress ikilisi indirilemedi |
| Gerçek tarayıcıda çıkarım | **Doğrulanmadı**: ortamda tarayıcı yoktu |
| Demo videosu | Yok |

## Bilinen engeller

1. `download.cypress.io` erişilemez → Cypress çalıştırılamaz.
2. Playwright/Puppeteer tarayıcı indirmeleri (CDN) erişilemez.
3. `huggingface.co` erişilemez; kabul edilmiş model de yok.
4. Gerçek kullanıcı yok: 0/15 gerçek oturum.
5. Ortamda Google Fonts dahil dış DNS yok.

## Engellerin aşılması için denenenler

- **Tarayıcı:** npm kayıt deposu erişilebilir olduğu için `@sparticuz/chromium@153.0.0` (npm paketi içinde Chromium 153 ikilisi) + `puppeteer-core@25.15.0` kuruldu. Gerçek headless Chromium çalıştı. Cypress senaryoları birebir porte edildi (`tools/browser-e2e/`).
- **Video:** ffmpeg sistemde mevcut. Chrome DevTools ekran yayını + ffmpeg ile kayıt yapıldı.

## Tamamlanması gereken dosyalar (aşama başında)

`docs/FINAL_AUDIT.md`, `docs/FINAL_REPORT.md`, `docs/MODEL_ROOT_CAUSE_ANALYSIS.md`, demo videosu, README insan incelemesi beyanı, CI'da tarayıcı işi.

## Aşama sırasında bulunan hatalar

| # | Hata | Nasıl bulundu | Düzeltme |
|---|---|---|---|
| 1 | `?debug=1` paneli 390 px ekranda varsayılan açık geliyor, rol/hedef seçeneklerini ve "Nöbeti devral"ı örtüyordu. v2.0 Cypress testlerini CI'da da kırardı. | Gerçek tarayıcıda 4/4 adaptif test karar ekranına geçemedi; ekran görüntüsü | Panel varsayılan kapalı, sağ altta küçük çip; içerik DOM'da gizli |
| 2 | SPA sunucuları eksik model dosyası için 200 + `index.html` döndürüyor. Özet denetimi modeli reddediyordu ama hata mesajı yanıltıcıydı ("özet uyuşmuyor"). | KÖ8 tarayıcı testi | Yükleyici `text/html` yanıtını "indirilemedi" olarak ele alır |
| 3 | Tarayıcı her CSV'ye `kaynak=gercek` yazıyordu; test amaçlı oturumlar yanlışlıkla gerçek veri sayılabilirdi. | Veri hattı incelemesi | `?test=1` oturumları `kaynak=test` yazar; birleştirici ve `train.py` reddeder |
| 4 | Test koşucusu, test içinde kapatılmış sayfayı tekrar kapatmaya çalışıp çöküyordu. | Veri hattı testi | Koşucu düzeltildi (yalnızca test altyapısı) |
| 5 | `page.screencast` gerçek zamanlı VP9 kodlaması nedeniyle 274 sn'de yalnızca ~22 sn video üretti. | İlk demo kaydı | CDP kare yakalama + kayıttan sonra H.264 kodlama |
