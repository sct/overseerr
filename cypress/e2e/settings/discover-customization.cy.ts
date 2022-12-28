describe('Discover Customization', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.intercept('/api/v1/settings/discover').as('getDiscoverSliders');
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

  it('can drag to re-order elements and save to persist the changes', () => {
    let dataTransfer = new DataTransfer();
    cy.visit('/settings');

    cy.get('[data-testid=discover-option]')
      .first()
      .trigger('dragstart', { dataTransfer });
    cy.get('[data-testid=discover-option]')
      .eq(1)
      .trigger('drop', { dataTransfer });
    cy.get('[data-testid=discover-option]')
      .eq(1)
      .trigger('dragend', { dataTransfer });

    cy.get('[data-testid=discover-option]')
      .eq(1)
      .should('contain', 'Recently Added');

    cy.get('[data-testid=discover-customize-submit').click();
    cy.wait('@getDiscoverSliders');

    cy.reload();

    dataTransfer = new DataTransfer();

    cy.get('[data-testid=discover-option]')
      .eq(1)
      .should('contain', 'Recently Added');

    cy.get('[data-testid=discover-option]')
      .first()
      .trigger('dragstart', { dataTransfer });
    cy.get('[data-testid=discover-option]')
      .eq(1)
      .trigger('drop', { dataTransfer });
    cy.get('[data-testid=discover-option]')
      .eq(1)
      .trigger('dragend', { dataTransfer });

    cy.get('[data-testid=discover-option]')
      .eq(1)
      .should('contain', 'Recent Requests');

    cy.get('[data-testid=discover-customize-submit').click();
    cy.wait('@getDiscoverSliders');
  });

  it('can create a new discover option and remove it', () => {
    cy.visit('/settings');
    cy.intercept('/api/v1/settings/discover/*').as('discoverSlider');

    const sliderTitle = 'Custom Keyword Slider';

    cy.get('#sliderType').select('TMDB Movie Keyword');

    cy.get('#title').type(sliderTitle);
    // First confirm that an invalid keyword doesn't allow us to submit anything
    cy.get('#data').type('invalidkeyword');

    cy.get('[data-testid=create-discover-option-form]')
      .find('button')
      .should('be.disabled');

    // Anime Keyword, for testing!
    cy.get('#data').clear();
    cy.get('#data').type('210024');

    // Confirming we have some results
    cy.contains('.slider-header', sliderTitle)
      .next('[data-testid=media-slider]')
      .find('[data-testid=title-card]');

    cy.get('[data-testid=create-discover-option-form]').submit();

    cy.wait('@discoverSlider');
    cy.wait('@getDiscoverSliders');

    cy.get('[data-testid=discover-option]')
      .first()
      .should('contain', sliderTitle);

    // Make sure its still there even if we reload
    cy.reload();

    cy.get('[data-testid=discover-option]')
      .first()
      .should('contain', sliderTitle);

    // Verify it's not rendering on our discover page (its still disabled!)
    cy.visit('/');

    cy.get('.slider-header').should('not.contain', sliderTitle);

    cy.visit('/settings');

    // Enable it, and check again
    cy.get('[data-testid=discover-option]')
      .first()
      .find('[role="checkbox"]')
      .click();

    cy.get('[data-testid=discover-customize-submit').click();
    cy.wait('@getDiscoverSliders');

    cy.visit('/');

    cy.contains('.slider-header', sliderTitle)
      .next('[data-testid=media-slider]')
      .find('[data-testid=title-card]');

    cy.visit('/settings');

    // let's delete it and confirm its deleted.
    cy.get('[data-testid=discover-option]')
      .first()
      .find('button')
      .should('contain', 'Remove')
      .click();

    cy.wait('@discoverSlider');
    cy.wait('@getDiscoverSliders');

    cy.get('[data-testid=discover-option]')
      .first()
      .should('not.contain', sliderTitle);
  });
});
