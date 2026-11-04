// 60–90 saniyelik adaptif demo videosu: aynı sahnede iki oyuncu, iki farklı deneyim.
// Çalıştır: npx cypress run --spec cypress/e2e/01-adaptif-demo.cy.js
// Video: cypress/videos/01-adaptif-demo.cy.js.mp4
// debug=1 paneli, uyarlamanın gerekçesini (olasılık ve eşik) göze batmadan sağ altta gösterir.
// rollout=on: model kabul statüsünde değilse geliştirici geçersiz kılmasıdır ve panelde DENEYSEL yazar.
const URL = '/?test=1&debug=1&rollout=on';
const BEKLE = 2500;

describe('Adaptif demo', () => {
  it('Oyuncu A zorlanır ve destek alır; Oyuncu B akıcıdır ve standart akışta kalır', () => {
    cy.clock(Date.now(), ['Date']);

    // Oyuncu A
    cy.baslaUrl(URL, 'mid', 'dev', 'learn');
    cy.wait(BEKLE);
    cy.tick(40000); // 40 sn düşünür
    cy.get('[data-testid="hint-btn"]').click();
    cy.wait(BEKLE);
    cy.get('[data-testid="choice-a"]').scrollIntoView().click();
    cy.wait(BEKLE);
    cy.get('[data-testid="adaptive-recap"]').scrollIntoView();
    cy.wait(BEKLE * 2);
    cy.get('[data-testid="next-btn"]').scrollIntoView().click();
    cy.get('[data-testid="adaptive-support"]').scrollIntoView();
    cy.wait(BEKLE * 2);

    // Oyuncu B: aynı sahne (Karar 1), farklı davranış
    cy.visit(URL);
    cy.modelHazir();
    cy.get('[data-testid="level-mid"]').click();
    cy.get('[data-testid="role-dev"]').click();
    cy.get('[data-testid="goal-learn"]').click();
    cy.get('[data-testid="start-btn"]').click();
    cy.wait(BEKLE);
    cy.tick(3000);
    cy.get('[data-testid="choice-b"]').scrollIntoView().click();
    cy.wait(BEKLE * 2);
    cy.get('[data-testid="next-btn"]').scrollIntoView().click();
    cy.get('[data-testid="hint-box"]').should('not.exist');
    cy.wait(BEKLE * 2);
  });
});
