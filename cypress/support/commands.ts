/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//

Cypress.Commands.add('login', (email, password) => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login');
      cy.contains('Use your Overseerr account').click();

      cy.get('[data-testid=email]').type(email);
      cy.get('[data-testid=password]').type(password);

      cy.get('[data-testid=local-signin-button]').click();

      cy.wait(1000);

      cy.url().should('contain', '/');
    },
    {
      validate() {
        cy.request('/api/v1/auth/me').its('status').should('eq', 200);
      },
    }
  );
});
