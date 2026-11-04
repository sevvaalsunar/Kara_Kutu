// spec.md §20 KÖ9: Python Oracle ile GERÇEK tarayıcıdaki onnxruntime-web aynı olasılığı vermeli.
// Beklenen değerler tests/parite.json'dan okunur (Python tarafından gerçek modelden üretilir).
describe('Diferansiyel parite: Python ↔ tarayıcı', () => {
  it('5 referans girdinin hepsinde |p_python − p_tarayıcı| < 1e-4', () => {
    cy.readFile('../tests/parite.json').then((ref) => {
      cy.visit('/?test=1&debug=1');
      cy.modelHazir();
      ref.referanslar.forEach((r) => {
        cy.window()
          .then((w) => w.__KK_MODEL__.predict(r.girdi))
          .then((p) => {
            cy.log(`${r.ad}: python ${r.beklenen_p} · tarayıcı ${p}`);
            expect(Math.abs(p - r.beklenen_p), r.ad).to.be.lessThan(ref.tolerans);
          });
        cy.sonP().should((p) => expect(Math.abs(p - r.beklenen_p)).to.be.lessThan(ref.tolerans));
      });
    });
  });

  it('Tarayıcıdaki model dosyası parite.json ile aynı model', () => {
    cy.readFile('../tests/parite.json').then((ref) => {
      cy.request({ url: '/model/config.json' }).its('body.artifact.sha256').should('eq', ref.model_sha256);
    });
  });
});
