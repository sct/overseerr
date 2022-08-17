describe('Login Page', () => {
  it('succesfully logs in as an admin', () => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
    cy.visit('/');
    cy.contains('Trending');
  });

  it('succesfully logs in as a local user', () => {
    cy.login(Cypress.env('USER_EMAIL'), Cypress.env('USER_PASSWORD'));
    cy.visit('/');
    cy.contains('Trending');
  });
});
