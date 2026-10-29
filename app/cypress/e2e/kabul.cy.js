// spec.md §8 kabul örnekleri ve §3–§4 kuralları

describe('Kabul örnekleri', () => {
  it('KÖ1: Yeni başlayan oyuncuda ipucu kutusu açık gelir, geri sayım yoktur', () => {
    cy.basla('new');
    cy.get('[data-testid="hint-box"]').should('be.visible');
    cy.get('[data-testid="tutor-reply"]').first()
      .should('contain', 'Saldırganı izlemek için açtığın kapıyı saldırgan da görebilir mi?');
    cy.get('[data-testid="countdown"]').should('not.exist');
  });

  it('KÖ2: Deneyimli oyuncuda süre dolarsa ICU-Net 1A seçer', () => {
    cy.clock();
    cy.basla('expert');
    cy.get('[data-testid="countdown"]').should('contain', '60');
    cy.tick(60000);
    cy.tick(100);
    cy.get('[data-testid="timeout-note"]')
      .should('have.text', 'Karar vermedin; ICU-Net senin yerine karar verdi.');
    cy.get('[data-testid="result-what"]').should('contain', 'Truva atı');
  });

  it('KÖ3: Tek iyi yol 03:28’de iyi sona gider', () => {
    cy.basla();
    cy.oyna(['b', 'a', 'a']);
    cy.get('[data-testid="ending"]').should('have.attr', 'data-ending', 'good');
    cy.get('[data-testid="game-clock"]').should('have.text', '03:28');
    cy.get('[data-testid="decision-summary"] > div').should('have.length', 3);
  });

  it('KÖ4: Doğru yolda son anda kısayol kötü sona gider', () => {
    cy.basla();
    cy.oyna(['b', 'a', 'b']);
    cy.get('[data-testid="ending"]').should('have.attr', 'data-ending', 'bad');
    cy.get('[data-testid="ending-reason"]').should('contain', 'Doğru yoldaydın');
  });

  it('KÖ5 (mekanik): Tutor mesajı gönderilir ve cevap gelir', () => {
    // Tutor'un cevabı ele vermemesi eval ile ölçülür (eval/). Burada yalnızca akış test edilir.
    cy.basla('new');
    cy.get('[data-testid="tutor-input"]').type('Hangisini seçmeliyim, sadece söyle');
    cy.get('[data-testid="tutor-send"]').click();
    cy.get('[data-testid="tutor-reply"]').last()
      .should('contain', 'Bu kararın geri alınabilir olup olmadığını nasıl anlarsın?');
  });
});

describe('Giriş ve kişiselleştirme', () => {
  it('Üç soru cevaplanmadan başla butonu pasiftir', () => {
    cy.visit('/?test=1');
    cy.get('[data-testid="start-btn"]').should('be.disabled');
    cy.get('[data-testid="level-mid"]').click();
    cy.get('[data-testid="role-sec"]').click();
    cy.get('[data-testid="start-btn"]').should('be.disabled');
    cy.get('[data-testid="goal-test"]').click();
    cy.get('[data-testid="start-btn"]').should('be.enabled');
  });

  it('"Biraz deneyimim var": ipucu kapalı gelir, butonla açılır', () => {
    cy.basla('mid');
    cy.get('[data-testid="hint-box"]').should('not.exist');
    cy.get('[data-testid="hint-btn"]').click();
    cy.get('[data-testid="hint-box"]').should('be.visible');
  });

  it('"Kavramları öğrenmek" kavram etiketini gösterir', () => {
    cy.basla('mid', 'dev', 'learn');
    cy.get('[data-testid="choice-b"]').click();
    cy.get('[data-testid="result-concept"]').should('contain', 'TEST');
  });

  it('"Kendimi sınamak" kavram etiketini gizler', () => {
    cy.basla('mid', 'dev', 'test');
    cy.get('[data-testid="choice-b"]').click();
    cy.get('[data-testid="result-concept"]').should('not.exist');
  });
});

describe('Oyun içi saat', () => {
  it('Saat kararlarla ilerler ve kalan süreyi gösterir', () => {
    cy.basla();
    cy.get('[data-testid="game-clock"]').should('have.text', '03:15');
    cy.get('[data-testid="time-left"]').should('have.text', '14 dk kaldı');
    cy.get('[data-testid="choice-b"]').click();
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="game-clock"]').should('have.text', '03:18');
    cy.get('[data-testid="choice-a"]').click();
    cy.get('[data-testid="next-btn"]').click();
    cy.get('[data-testid="game-clock"]').should('have.text', '03:24');
    cy.get('[data-testid="time-left"]').should('have.text', '5 dk kaldı');
  });
});
