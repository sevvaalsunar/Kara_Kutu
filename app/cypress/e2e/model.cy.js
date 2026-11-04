// spec.md §18 ve §20 KÖ8: model yükleme, gölge mod ve hata davranışı.
describe('Model yükleme ve hata davranışı (v2.0)', () => {
  it('Model yüklenir; sürüm ve statü debug panelinde görünür', () => {
    cy.visit('/?test=1&debug=1');
    cy.modelHazir();
    cy.get('[data-testid="model-version"]').should('contain', '2.0.0');
    cy.get('[data-testid="model-release-status"]').invoke('text').should('match', /kabul|aday|reddedildi/);
  });

  it('Kabul edilmemiş model varsayılan olarak yalnızca gölgede çalışır', () => {
    cy.readFile('../model/gelistirme/config.json').then((cfg) => {
      cy.visit('/?test=1&debug=1');
      cy.modelHazir();
      if (cfg.release_status !== 'kabul') cy.get('[data-testid="rollout-mode"]').should('have.attr', 'data-mode', 'shadow');
    });
  });

  it('Gölge modda olasılık hesaplanır ama oyun değişmez', () => {
    cy.clock(Date.now(), ['Date']);
    cy.baslaUrl('/?test=1&debug=1&rollout=shadow', 'mid');
    cy.tick(40000);
    cy.get('[data-testid="hint-btn"]').click();
    cy.get('[data-testid="choice-a"]').click();
    cy.sonP().should('be.greaterThan', 0.65);
    cy.get('[data-testid="adaptive-recap"]').should('not.exist');
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="adaptive-support"]').should('not.exist');
  });

  it('KÖ8: Model indirilemezse oyun v1 kurallarıyla sonuna kadar oynanır', () => {
    cy.visit('/?test=1&debug=1&rollout=on&model=bozuk');
    cy.get('[data-testid="model-status"]', { timeout: 20000 }).should('have.attr', 'data-status', 'devre-disi');
    cy.get('[data-testid="model-error"]').should('contain', 'indirilemedi');
    cy.get('[data-testid="level-mid"]').click();
    cy.get('[data-testid="role-dev"]').click();
    cy.get('[data-testid="goal-learn"]').click();
    cy.get('[data-testid="start-btn"]').click();
    cy.oyna(['b', 'a', 'a']);
    cy.get('[data-testid="ending"]').should('have.attr', 'data-ending', 'good');
    cy.get('[data-testid="adaptive-recap"]').should('not.exist');
  });

  it('?model=off modeli hiç yüklemez', () => {
    cy.visit('/?test=1&debug=1&model=off');
    cy.get('[data-testid="model-status"]').should('have.attr', 'data-status', 'kapali');
    cy.get('[data-testid="rollout-mode"]').should('have.attr', 'data-mode', 'off');
  });

  it('Aralık dışı özellikle çıkarım reddedilir (sahte olasılık üretilmez)', () => {
    cy.visit('/?test=1&debug=1');
    cy.modelHazir();
    cy.readFile('../tests/parite.json').then((ref) => {
      const bozuk = { ...ref.referanslar[0].girdi, hint_usage_rate: 2 };
      cy.window().then((w) =>
        w.__KK_MODEL__.predict(bozuk).then(
          () => { throw new Error('Geçersiz girdi kabul edildi'); },
          (err) => expect(err.message).to.contain('hint_usage_rate'),
        ),
      );
    });
  });
});
