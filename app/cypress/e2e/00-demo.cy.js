// 60 saniyelik demo videosu için yavaş oynanış.
// Çalıştır: npx cypress run --spec cypress/e2e/00-demo.cy.js
// Video: cypress/videos/00-demo.cy.js.mp4

const BEKLE = 3000;

describe('Demo', () => {
  it('İyi son ve ardından kötü son', () => {
    cy.visit('/?test=1');
    cy.wait(BEKLE);
    cy.get('[data-testid="level-new"]').click();
    cy.get('[data-testid="role-sec"]').click();
    cy.get('[data-testid="goal-learn"]').click();
    cy.wait(1500);
    cy.get('[data-testid="start-btn"]').click();
    cy.wait(BEKLE);

    // Tutor ile kısa bir etkileşim
    cy.get('[data-testid="tutor-input"]').type('Hangisini seçmeliyim?', { delay: 60 });
    cy.get('[data-testid="tutor-send"]').click();
    cy.wait(BEKLE);

    // İyi yol: 1B → 2B1 → A
    ['b', 'a', 'a'].forEach((harf) => {
      cy.get(`[data-testid="choice-${harf}"]`).scrollIntoView().click();
      cy.wait(BEKLE);
      cy.get('[data-testid="result-why"]').scrollIntoView();
      cy.wait(BEKLE);
      cy.get('[data-testid="next-btn"]').scrollIntoView().click();
      cy.wait(1500);
    });
    cy.get('[data-testid="ending"]').should('have.attr', 'data-ending', 'good');
    cy.get('[data-testid="decision-summary"]').scrollIntoView();
    cy.wait(BEKLE);

    // Kötü son: 1B → 2B1 → B
    cy.get('[data-testid="restart-btn"]').scrollIntoView().click();
    cy.get('[data-testid="level-mid"]').click();
    cy.get('[data-testid="role-sec"]').click();
    cy.get('[data-testid="goal-test"]').click();
    cy.get('[data-testid="start-btn"]').click();
    ['b', 'a', 'b'].forEach((harf) => {
      cy.get(`[data-testid="choice-${harf}"]`).scrollIntoView().click();
      cy.wait(1500);
      cy.get('[data-testid="next-btn"]').scrollIntoView().click();
      cy.wait(1000);
    });
    cy.get('[data-testid="ending"]').should('have.attr', 'data-ending', 'bad');
    cy.wait(BEKLE);
    cy.get('[data-testid="decision-summary"]').scrollIntoView();
    cy.wait(BEKLE);
  });
});
