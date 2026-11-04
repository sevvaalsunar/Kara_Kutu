// spec.md §15: veri toplama modu.
describe('Veri toplama modu (v2.0)', () => {
  it('Onay verilmeden nöbet devralınamaz; mod her zaman gölgededir', () => {
    cy.visit('/?test=1&debug=1&veri=1&rollout=on');
    cy.get('[data-testid="level-mid"]').click();
    cy.get('[data-testid="role-dev"]').click();
    cy.get('[data-testid="goal-learn"]').click();
    cy.get('[data-testid="start-btn"]').should('be.disabled');
    cy.get('[data-testid="consent"]').check();
    cy.get('[data-testid="start-btn"]').should('be.enabled');
    cy.get('[data-testid="rollout-mode"]').should('have.attr', 'data-mode', 'shadow');
  });

  it('Son ekranında oturum CSV dışa aktarma düğmesi vardır; normal modda yoktur', () => {
    cy.visit('/?test=1&veri=1');
    cy.get('[data-testid="level-mid"]').click();
    cy.get('[data-testid="role-dev"]').click();
    cy.get('[data-testid="goal-learn"]').click();
    cy.get('[data-testid="consent"]').check();
    cy.get('[data-testid="start-btn"]').click();
    cy.oyna(['b', 'a', 'a']);
    cy.get('[data-testid="export-btn"]').should('be.visible');
    cy.basla();
    cy.oyna(['b', 'a', 'a']);
    cy.get('[data-testid="export-btn"]').should('not.exist');
  });
});
