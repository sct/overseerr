describe('General Settings', () => {
  beforeEach(() => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
  });

  it('opens the settings page from the home page', () => {
    cy.visit('/');

    cy.get('[data-testid=sidebar-toggle]').click();
    cy.get('[data-testid=sidebar-menu-settings-mobile]').click();

    cy.get('.heading').should('contain', 'General Settings');
  });

  it('modifies setting that requires restart', () => {
    cy.visit('/settings');

    cy.get('#trustProxy').click();
    cy.get('form').submit();
    cy.get('[data-testid=modal-title]').should(
      'contain',
      'Server Restart Required'
    );

    cy.get('[data-testid=modal-ok-button]').click();
    cy.get('[data-testid=modal-title]').should('not.exist');

    cy.get('[type=checkbox]#trustProxy').click();
    cy.get('form').submit();
    cy.get('[data-testid=modal-title]').should('not.exist');
  });
});
