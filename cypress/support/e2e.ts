import './commands';

before(() => {
  cy.exec('yarn cypress:prepare');
});
