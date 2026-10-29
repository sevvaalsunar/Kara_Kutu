// Ortak komutlar. Tüm testler ?test=1 modunda çalışır: tutor API çağırmaz, sabit cevap döner.

Cypress.Commands.add('basla', (seviye = 'mid', rol = 'dev', hedef = 'learn') => {
  cy.visit('/?test=1');
  cy.get(`[data-testid="level-${seviye}"]`).click();
  cy.get(`[data-testid="role-${rol}"]`).click();
  cy.get(`[data-testid="goal-${hedef}"]`).click();
  cy.get('[data-testid="start-btn"]').should('be.enabled').click();
});

// harfler: ['b', 'a', 'a'] gibi; her karar için choice-a veya choice-b
Cypress.Commands.add('oyna', (harfler) => {
  harfler.forEach((harf) => {
    cy.get(`[data-testid="choice-${harf}"]`).click();
    cy.get('[data-testid="result-what"]').should('be.visible');
    cy.get('[data-testid="next-btn"]').click();
  });
});
