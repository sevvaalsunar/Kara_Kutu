// spec.md §20 KÖ6–KÖ7: model gerçek oynanışı değiştirir.
// Uyarlama kolu ?rollout=on ile açılır (model kabul statüsünde değilse geliştirici geçersiz kılması gerekir).
// cy.clock yalnızca Date'i dondurur; böylece karar süresi tam olarak cy.tick kadar olur.
const URL = '/?test=1&debug=1&rollout=on';

describe('Adaptif oynanış (v2.0)', () => {
  beforeEach(() => {
    cy.readFile('../tests/parite.json').as('ref');
  });

  it('KÖ6: Zorlanan oyuncu kavram özeti ve sonraki kararda ek destek alır', function () {
    cy.clock(Date.now(), ['Date']);
    cy.baslaUrl(URL, 'mid');
    cy.get('[data-testid="hint-box"]').should('not.exist');
    cy.tick(40000);
    cy.get('[data-testid="hint-btn"]').click(); // ipucu açıldı: 1 tereddüt, ipucu kullanıldı
    cy.get('[data-testid="choice-a"]').click(); // 1A (riskli)

    const beklenen = this.ref.referanslar.find((r) => r.ad === 'zorlanan_ilk_karar').beklenen_p;
    cy.sonP().should((p) => expect(Math.abs(p - beklenen)).to.be.lessThan(1e-4));
    cy.get('[data-testid="adaptation-applied"]').should('have.text', 'UYARLANDI');
    cy.get('[data-testid="adaptive-recap"]').should('be.visible').and('contain', 'Kavram özeti');
    cy.get('[data-testid="adaptive-note"]').should('contain', 'Önceki kararlarına göre');

    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="hint-box"]').should('be.visible'); // seviye "mid" olmasına rağmen açık
    cy.get('[data-testid="adaptive-support"]').should('be.visible').invoke('text').should('match', /\?"?$/);
  });

  it('KÖ7: Akıcı oyuncu standart akışta kalır', function () {
    cy.clock(Date.now(), ['Date']);
    cy.baslaUrl(URL, 'mid');
    cy.tick(3000);
    cy.get('[data-testid="choice-b"]').click(); // 1B, ipucusuz

    const beklenen = this.ref.referanslar.find((r) => r.ad === 'akici_ilk_karar').beklenen_p;
    cy.sonP().should((p) => expect(Math.abs(p - beklenen)).to.be.lessThan(1e-4));
    cy.get('[data-testid="adaptation-applied"]').should('have.text', 'standart');
    cy.get('[data-testid="adaptive-recap"]').should('not.exist');
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="hint-box"]').should('not.exist');
    cy.get('[data-testid="adaptive-support"]').should('not.exist');
  });

  it('Destek alan deneyimli oyuncunun sonraki geri sayımı 90 sn olur', () => {
    cy.clock(Date.now(), ['Date']);
    cy.baslaUrl(URL, 'expert');
    cy.get('[data-testid="countdown"]').should('contain', '60');
    cy.tick(40000);
    cy.get('[data-testid="hint-btn"]').click();
    cy.get('[data-testid="choice-a"]').click();
    cy.get('[data-testid="adaptive-recap"]').should('be.visible');
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="countdown"]').invoke('text').then((t) => expect(parseInt(t, 10)).to.be.greaterThan(60));
  });

  it('Destek soruları seçenek adı veya harfi önermez (§7)', () => {
    cy.clock(Date.now(), ['Date']);
    cy.baslaUrl(URL, 'mid');
    cy.tick(40000);
    cy.get('[data-testid="hint-btn"]').click();
    cy.get('[data-testid="choice-a"]').click();
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="adaptive-support"]').invoke('text').then((t) => {
      expect(t).not.to.match(/\b(A|B)\s*seçeneğ|\b2A1\b|\b2A2\b|Canlıda müdahale|Rollback/i);
    });
  });
});
