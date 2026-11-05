# cypress/

Cypress testleri, uygulamanın kendi `package.json`'ı ve `cypress.config.cjs`'i ile birlikte **`app/cypress/`** altındadır. v1 testleri geçen haftadan beri oradadır; taşımak regresyon testlerinin geçmişini koparırdı.

| Dosya | İçerik |
|---|---|
| [`app/cypress/e2e/yollar.cy.js`](../app/cypress/e2e/yollar.cy.js), [`kabul.cy.js`](../app/cypress/e2e/kabul.cy.js) | v1 regresyon E2E (8 yol + kabul örnekleri) |
| [`app/cypress/e2e/parite.cy.js`](../app/cypress/e2e/parite.cy.js) | **Diferansiyel test:** `data-cy="p"` ile tarayıcı olasılığı ↔ `tests/parite.json` (Python Oracle), tolerans `1e-4` |
| [`app/cypress/e2e/adaptif.cy.js`](../app/cypress/e2e/adaptif.cy.js), [`model.cy.js`](../app/cypress/e2e/model.cy.js), [`veri.cy.js`](../app/cypress/e2e/veri.cy.js), [`ux.cy.js`](../app/cypress/e2e/ux.cy.js) | v2.0 kabul örnekleri, model hata davranışı, veri modu, UX |

```bash
cd app && npm run build && npm run serve:prod   # terminal 1
cd app && npx cypress run                       # terminal 2
```

Durum: Cypress dosyaları geliştirme ortamında koşturulamadı (ikili indirilemedi). İlk koşu CI'da olacak (`.github/workflows/test.yml` → `cypress`). Aynı senaryoların gerçek Chromium portları (`tools/browser-e2e/`) dev ve üretim derlemesinde 41/41 geçti.
