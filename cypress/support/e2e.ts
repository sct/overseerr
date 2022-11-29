import './commands';

before(() => {
  if (Cypress.env('SEED_DATABASE')) {
    cy.exec('npm run cypress:prepare');
  }
});
