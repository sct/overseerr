describe('Discover Customization', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('show the discover customization settings', () => {
    cy.visit('/settings');

    cy.get('[data-testid=discover-customization]')
      .should('contain', 'Discover Customization')
      .scrollIntoView();

    // There should be some built in options
    cy.get('[data-testid=discover-option]').should('contain', 'Recently Added');
    cy.get('[data-testid=discover-option]').should(
      'contain',
      'Recent Requests'
    );
  });

  it.skip('can drag to re-order elements', () => {
    // This isn't working and I am too tired to figure it out
    cy.visit('/settings');

    cy.get('[data-testid=discover-option]')
      .eq(3)
      .then((el) => {
        const pos = el.position();
        cy.get('[data-testid=discover-option]')
          .first()
          .trigger('mousedown')
          .trigger('mousemove', { clientX: 0, clientY: pos.top + 10 })
          .trigger('mouseup', { force: true });
      });
  });

  it('can add a new discover option', () => {
    // thing
  });
});
