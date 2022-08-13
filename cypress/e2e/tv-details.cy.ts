describe('TV Details', () => {
  it('loads a movie page', () => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
    // Try to load stranger things
    cy.visit('/tv/66732');

    cy.get('[data-testid=media-title]').should(
      'contain',
      'Stranger Things (2016)'
    );
  });
});
