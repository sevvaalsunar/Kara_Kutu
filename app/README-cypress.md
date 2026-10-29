# Cypress E2E testleri

Testler uygulamayı `?test=1` modunda açar; bu modda tutor Gemini API'yi çağırmaz, sabit bir cevap döner. Bu yüzden API anahtarı gerekmez ve her koşu aynı sonucu verir.

## Kurulum (bir kez)

```
cd app
npm install
```

Cypress `devDependencies` içinde olduğu için `npm install` onu da kurar.

## Çalıştırma

İki terminal aç:

```
# Terminal 1: uygulamayı başlat (http://localhost:3000)
cd app
npm run dev

# Terminal 2: testleri koş
cd app
npx cypress run
```

Testleri tarayıcıda adım adım izlemek için `npx cypress open`.

## Dosyalar

| Dosya | Ne test ediyor |
|---|---|
| `cypress/e2e/yollar.cy.js` | 8 yolun hepsi: doğru son, doğru neden metni, doğru saat; "Baştan oyna" |
| `cypress/e2e/kabul.cy.js` | spec.md §8'deki 5 kabul örneği, giriş ve kişiselleştirme kuralları, oyun içi saat |
| `cypress/e2e/00-demo.cy.js` | Yaklaşık 60 saniyelik yavaş oynanış (demo videosu için) |

## Demo videosu

```
npx cypress run --spec cypress/e2e/00-demo.cy.js
```

Video `cypress/videos/00-demo.cy.js.mp4` olarak kaydedilir.
