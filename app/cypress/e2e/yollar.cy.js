// spec.md §5: 8 yolun hepsi. İyi son yalnızca 1B → 2B1 → A.
// choice-a / choice-b eşlemesi (spec §9): K1 1A/1B, K2 2A1/2A2 veya 2B1/2B2, K3 A/B.

const YOLLAR = [
  { ad: '1A → 2A1 → A', harfler: ['a', 'a', 'a'], son: 'bad', saat: '03:28', neden: 'Kayıtları korudun' },
  { ad: '1A → 2A1 → B', harfler: ['a', 'a', 'b'], son: 'bad', saat: '03:26', neden: 'yetkisiz sabotaj' },
  { ad: '1A → 2A2 → A', harfler: ['a', 'b', 'a'], son: 'bad', saat: '03:28', neden: 'son 6 saatlik tıbbi verisi kayıp' },
  { ad: '1A → 2A2 → B', harfler: ['a', 'b', 'b'], son: 'bad', saat: '03:26', neden: 'tamamen kullanılamaz' },
  { ad: '1B → 2B1 → A', harfler: ['b', 'a', 'a'], son: 'good', saat: '03:28', neden: 'son tarihten 1 dakika önce' },
  { ad: '1B → 2B1 → B', harfler: ['b', 'a', 'b'], son: 'bad', saat: '03:26', neden: 'Doğru yoldaydın' },
  { ad: '1B → 2B2 → A', harfler: ['b', 'b', 'a'], son: 'bad', saat: '03:28', neden: 'iki gün sonra fark edildi' },
  { ad: '1B → 2B2 → B', harfler: ['b', 'b', 'b'], son: 'bad', saat: '03:26', neden: 'fidye yazılımı' },
];

describe('Tüm yollar ve sonlar', () => {
  YOLLAR.forEach((yol) => {
    it(`${yol.ad} → ${yol.son === 'good' ? 'İYİ' : 'KÖTÜ'} son`, () => {
      cy.basla();
      cy.oyna(yol.harfler);
      cy.get('[data-testid="ending"]').should('have.attr', 'data-ending', yol.son);
      cy.get('[data-testid="ending-reason"]').should('contain', yol.neden);
      cy.get('[data-testid="game-clock"]').should('have.text', yol.saat);
      cy.get('[data-testid="decision-summary"] > div').should('have.length', 3);
    });
  });

  it('Baştan oyna giriş ekranına döner ve seçimleri sıfırlar', () => {
    cy.basla();
    cy.oyna(['b', 'a', 'a']);
    cy.get('[data-testid="restart-btn"]').click();
    cy.get('[data-testid="start-btn"]').should('be.disabled');
    cy.get('[data-testid="game-clock"]').should('have.text', '03:14');
  });
});
