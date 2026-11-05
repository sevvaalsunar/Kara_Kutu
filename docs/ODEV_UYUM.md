# Ödev metnine uyum — YZM301 v2.0 (100 puan + 10 bonus)

Kaynak: ödev metni ("Başlangıç reposu: seyyah/huggingface-hello-web … Teslim … Puanlama"). Her satırdaki kanıt repoda bulunur ve son regresyonda gerçekten koşturulmuştur.

**Statüler:**
- ✅ tamam
- ⚠️ kısmen / risk var
- ❌ eksik
- 👤 senin yapman gereken (bu ortamdan yapılamaz)

## Puanlama kalemleri

| Kalem (puan) | Ödevin istediği | Repodaki karşılığı | Durum |
|---|---|---|---|
| **Spec ve kabul örnekleri (10)** | Model gereksinimi, eval metriği, kabul eşiği eğitimden **önce**; 3 yeni kabul örneği | `spec.md` §11–§20; eşik ve kapılar `model/egitim_ayarlari.json`'da, eğitimden önce `6ffaaeb` commit'inde. 5 yeni kabul örneği (KÖ6–KÖ10) | ✅ |
| **Veri (10)** | ≥ 15 gerçek oturum, `SOZLUK.md`, `kaynak` sütunu; sentetik üretici kuralı ve tohumu README'de; KVKK | `data/oturumlar.csv` (400 sentetik oturum), `data/SOZLUK.md`, `kaynak` sütunu, tohum 20261104 (README ve `data/README.md`), kişisel veri yok. Veri toplama modu (`?veri=1`), katılımcı yönergesi, birleştirici ve rapor hazır | ⚠️ **Gerçek oturum 0/15.** Ödev metnine göre yalnız sentetik veriyle bu kalemin **yarısı** alınır. 👤 Kalan yarı için 15 gerçek oturum gerekir (ör. 3 arkadaş × 5 oturum) |
| **Tekrarlanabilir eğitim ve eval kapısı (15)** | `train.py` tek komut, sabit tohum, başka ortamda aynı doğruluk, metrikler `config.json`'da, eşik altında hata verip durur | `python train.py` → kapı geçmediği için çıkış 1, dosya yazılmaz. Temiz klonda aynı sonuç (`docs/kanit/temiz-ortam.txt`). Yapıtlar bayt bayt tekrarlanabilir. Metrikler `config.json` → `evaluation` | ✅ |
| **Somut artefakt ve model kartı (10)** | `model.onnx` + sözleşme `config.json` + `model/README.md`; ONNX ↔ sklearn farkı ≤ 1e-4 | `model/README.md` (Mitchell vd. yapısında kart); `model.onnx` ve `config.json` **`model/gelistirme/`** altında (reddedildi statüsü); şema `model/config.schema.json`; fark 2.6e-7 | ⚠️ Dosyalar `model/` kökünde değil, `model/gelistirme/` altında. Bu bilinçli: kök yalnızca kabul edilmiş model içindir. Kart bunu dosya tablosuyla açıklıyor. |
| **Yayın (15)** | Public HF model reposu, commit'e sabitli URL, `RELEASE.md`'de değişiklikler, rollback, Shadow / Canary / Progressive, ödünleşim matrisi ve 3 soru | `RELEASE.md`: değişiklikler, matris, 3 soru tablosu, gölge → %5 → %25/50/100 planı, geri dönüş prosedürü ve testleri, kaynaklar. Yayın betiği commit'e sabitliyor ve indirme sonrası SHA-256 doğruluyor | ❌ **HF reposu ve commit'li link yok.** Ödev "eşiği geçmeyen model yayınlanmaz" diyor; bu yüzden yayın bilerek yapılmadı. Belgeleme tamam; link puanı risk altında. Aşağıdaki "Karar noktası"na bakın. |
| **Uygulamada çıkarım (15)** | Model web ve/veya mobilde çalışır ve kararı oyunun davranışını değiştirir | Tarayıcıda `onnxruntime-web`. p ≥ 0.65 → kavram özeti, sonraki kararda tutor ve ek destek, 90 sn sayaç; destek sürekliliği. Gerçek Chromium'da dev ve üretim derlemesinde doğrulandı | ⚠️ Mekanizma tam ve kanıtlı. Ancak model reddedildiği için **normal kullanıcıda gölge**; davranış değişikliği yalnızca `?rollout=on` ile görülüyor. Demo ve uygulama bunu açıkça gösteriyor. |
| **Diferansiyel test ve regresyon E2E (15)** | `tests/parite.py`, `tests/parite.json` (5 referans), `data-cy="p"`, fark < 1e-4; geçen haftanın E2E testleri kırılmadan geçer; `cypress/` | `tests/parite.py` + `parite.json` (5) + `parite_sinir.json` (34); `data-cy="p"`. Gerçek tarayıcıda fark 0; v1 regresyonu dev 19/19, üretim 19/19. Cypress dosyaları `app/cypress/` (kökte `cypress/README.md` yönlendirmesi) | ⚠️ Cypress'in **kendisi** henüz hiç koşmadı (ikili indirilemedi). Aynı senaryolar puppeteer ile gerçek Chromium'da 41/41 geçti. 👤 Push sonrası CI'daki Cypress sonucu kanıt olur. |
| **Demo, README, sınav tasarımı (10)** | 60–90 sn demo, aynı sahnede iki oyuncu iki farklı karar; README kurulum ≤ 3 komut; `SINAV_TASARIMI.md` ≤ 1 sayfa; README sonunda 3–5 maddelik ajan beyanı | Demo 77 sn (p = 0.730 ve 0.293, aynı sahne); README kurulum 3 komut; sınav 1 sayfa (ölçüldü); beyan README'nin sonunda, 5 madde | ⚠️ 👤 Demo videosu **bir yere yüklenmeli** (link gerekiyor). Beyandaki "elle düzeltilen çıktılar" maddesini yalnızca sen doldurabilirsin. |
| **Bonus (+10)** | Kendi sunucunuzda tüketici, aynı referanslarda < 1e-4 | `server/app.py` (FastAPI + onnxruntime); gerçek HTTP testinde en büyük fark 3.0e-8; `render.yaml` hazır | ⚠️ Yerel olarak doğrulandı. "Kendi sunucunuzda çalışan" koşulu için 👤 Render.com'a dağıtım ve canlı URL gerekir. |

## Kurallar

| Kural | Durum |
|---|---|
| Tabular veri, küçük model, sklearn → ONNX | ✅ Lojistik regresyon, 11 özellik |
| Model çıktısı oyunun davranışını gerçekten değiştirir | ✅ Mekanizma (gölge/geçersiz kılma notu yukarıda) |
| Başlangıç örneğini olduğu gibi kopyalamamak | ✅ Kendi hedefi (bir sonraki kararda zorlanma), kendi 11 özelliği (tereddüt, kavram hâkimiyeti, dal riski…) |
| KVKK: ad, e-posta, cihaz kimliği, konum yok; rastgele oturum kimliği | ✅ Doğrulayıcı kişisel veri sütunlarını reddeder |
| Kapsam dışı: LLM ince ayarı, ücretli barındırma, gerçek hasta verisi, hesap/giriş | ✅ Hiçbiri yok |
| Ajan beyanı, README sonunda 3–5 madde | ✅ (bir madde senin doldurman için açık) |
| Orijinal kaynaklara referans | ✅ `RELEASE.md` → "Kaynaklar ve hangi karara dayanak oldukları" |
| "Model doğruluğu tek başına puan getirmez; dürüstçe ölçülmüş düşük doğruluklu model daha çok puan alır" | ✅ Metrikler, tavan analizi, kalibrasyon ve kör noktalar kartta ve kök neden analizinde |
| Linklerin giriş yapmadan açılması | 👤 Push ve yükleme sonrası gizli pencerede kontrol |

## Karar noktası: Hugging Face linki

Ödev iki şeyi aynı anda istiyor:
- "Eşiği geçmeyen model yayınlanmaz."
- Teslimde HF model linki (Yayın kalemi, 15 puan).

Model eşiği geçmediği için bu ikisi şu an çelişiyor. Seçenekler:

1. **Yayınlamamak (mevcut durum):** Kurala ve kendi spec'ine sadık. Yayın kaleminde link kısmı eksik kalır; belgeleme tam.
2. **Gerçek veri toplayıp yeniden eğitmek:** 15 gerçek oturumla model kapıyı geçerse `scripts/publish_hf.py` gerçek, commit'li yayını yapar. Geçmezse 1. seçenek geçerli kalır.
3. **Önerilmeyen:** Reddedilmiş modeli yayınlamak ya da eşiği sonradan düşürmek. Bu, ödevin kendi kuralını ve spec §17'yi çiğner. Ödev metnindeki "eşik eğitimden ÖNCE yazılır" vurgusu tam olarak bunu yasaklıyor.

## Senin yapman gerekenler (bu ortamdan yapılamaz)

| # | İş | Etkisi |
|---|---|---|
| 1 | Repoyu GitHub'a push et; Actions'ta Pages ve test iş akışlarını kontrol et | Link 1 ve 3; Cypress'in ilk gerçek koşusu |
| 2 | Demo videosunu YouTube'a (liste dışı) veya Drive'a yükle, gizli pencerede aç | Link 4 |
| 3 | 15 gerçek oturum topla (`docs/KATILIMCI.md`) | Veri kaleminin kalan yarısı; modelin kabul edilip yayınlanabilmesi (link 2) |
| 4 | İstersen bonus için `render.yaml` ile Render'a dağıt | Bonus +10 |
| 5 | README sonundaki "elle düzeltilen çıktılar" maddesini doldur | Beyan kuralı |
