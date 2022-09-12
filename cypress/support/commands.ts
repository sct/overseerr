/// <reference types="cypress" />
import 'cy-mobile-commands';

Cypress.Commands.add('login', (email, password) => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login');
      cy.contains('Use your Overseerr account').click();

      cy.get('[data-testid=email]').type(email);
      cy.get('[data-testid=password]').type(password);

      cy.intercept('/api/v1/auth/local').as('localLogin');
      cy.get('[data-testid=local-signin-button]').click();

      cy.wait('@localLogin');

      cy.url().should('contain', '/');
    },
    {
      validate() {
        cy.request('/api/v1/auth/me').its('status').should('eq', 200);
      },
    }
  );
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
});

Cypress.Commands.add('loginAsUser', () => {
  cy.login(Cypress.env('USER_EMAIL'), Cypress.env('USER_PASSWORD'));
});
