# KARA KUTU — uygulama

Google AI Studio ile üretilen React + Express uygulaması. Tutor, sunucu tarafında Gemini API ile çalışır (`server.ts`).

AI Studio'daki proje: https://ai.studio/apps/0d3c42eb-7942-4398-a0f7-80546707e3c9

## Yerelde çalıştırma

Gerekli: Node.js 20 veya üstü.

```
npm install
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır.

Başka cihazdan açmak için bilgisayar ve telefon aynı Wi-Fi ağında olmalı. Terminalde yazan `Network preview` adresini telefonun tarayıcısına girin. Windows Güvenlik Duvarı 3000 portuna yerel ağ bağlantısını engellerse uygulamanıza izin verin.

## Tutor için API anahtarı

Bu klasörde `.env` adında bir dosya oluşturup içine şunu yazın:

```
GEMINI_API_KEY=anahtarınız
```

Sunucu önce `GEMINI_API_KEY1`, yoksa `GEMINI_API_KEY` değişkenini okur. Anahtar yoksa tutor her karar için başlangıç ipucunu gösterir; oyun yine oynanır. `.env` dosyası `.gitignore`'dadır, repoya girmez.

Tutor önce `gemini-3.1-flash-lite`, o yanıt vermezse `gemini-3.8-flash` modelini dener; her deneme 15 saniyeyle sınırlıdır. Hangi modelin yanıt verdiği sunucu konsoluna yazılır.

## Test modu

Adrese `?test=1` eklenirse tutor API'yi çağırmaz ve sabit bir cevap döner. Cypress testleri bu modu kullanır.

## Testler

Bkz. `README-cypress.md`.
