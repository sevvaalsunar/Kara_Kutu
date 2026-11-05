// UX turu sonrası düzeltmeler (spec §14 madde 4–5, KÖ10). Puppeteer karşılığı: tools/browser-e2e/specs.mjs → ux
describe('UX düzeltmeleri (v2.0)', () => {
  it('KÖ10: Zorlanmaya devam eden oyuncudan destek çekilmez', () => {
    cy.clock(Date.now(), ['Date']);
    cy.baslaUrl('/?test=1&debug=1&rollout=on', 'mid');
    cy.tick(40000);
    cy.get('[data-testid="hint-btn"]').click();
    cy.get('[data-testid="choice-a"]').click();
    cy.get('[data-testid="adaptive-recap"]').should('exist');
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="adaptive-support"]').should('be.visible');
    cy.tick(30000);
    cy.get('[data-testid="choice-a"]').click();
    cy.sonP().should('be.lessThan', 0.65);
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="adaptive-support"]').should('be.visible');
  });

  it('DENEYSEL şeridi yalnızca geçersiz kılmayla görünür; normal kullanıcıda panel de yok', () => {
    cy.visit('/?test=1&debug=1&rollout=on');
    cy.modelHazir();
    cy.get('[data-testid="experimental-banner"]').should('be.visible');
    cy.visit('/?test=1&debug=1');
    cy.modelHazir();
    cy.get('[data-testid="experimental-banner"]').should('not.exist');
    cy.visit('/');
    cy.get('[data-testid="level-mid"]').should('be.visible');
    cy.get('[data-testid="experimental-banner"]').should('not.exist');
    cy.get('[data-testid="debug-panel"]').should('not.exist');
  });

  it('Başlat pasifken eksik adım yazılır', () => {
    cy.visit('/?test=1&veri=1');
    cy.get('[data-testid="start-hint"]').should('contain', 'seviyeni');
    cy.get('[data-testid="level-mid"]').click();
    cy.get('[data-testid="role-dev"]').click();
    cy.get('[data-testid="goal-learn"]').click();
    cy.get('[data-testid="start-hint"]').should('contain', 'gizlilik notunu onayla');
    cy.get('[data-testid="consent"]').check();
    cy.get('[data-testid="start-hint"]').should('not.exist');
  });

  it('Son ekranda kavram kartı yalnızca “Kavramları öğrenmek” hedefinde', () => {
    cy.basla('mid', 'dev', 'learn');
    cy.oyna(['a', 'a', 'b']);
    cy.get('[data-testid="ending-concepts"]').should('contain', 'TEKRAR ET');
    cy.basla('mid', 'dev', 'test');
    cy.oyna(['a', 'a', 'b']);
    cy.get('[data-testid="ending"]').should('exist');
    cy.get('[data-testid="ending-concepts"]').should('not.exist');
  });

  it('Oyun kontrolleri en az 44 px yüksekliğinde', () => {
    cy.baslaUrl('/?test=1&debug=1', 'new');
    ['hint-btn', 'tutor-input', 'tutor-send', 'choice-a', 'choice-b'].forEach((id) => {
      cy.get(`[data-testid="${id}"]`).invoke('outerHeight').should('be.gte', 44);
    });
  });
});
