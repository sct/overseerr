const clickFirstTitleCardInSlider = (sliderTitle: string): void => {
  cy.contains('.slider-header', sliderTitle)
    .next('[data-testid=media-slider]')
    .find('[data-testid=title-card]')
    .first()
    .trigger('mouseover')
    .find('[data-testid=title-card-title]')
    .invoke('text')
    .then((text) => {
      cy.contains('.slider-header', sliderTitle)
        .next('[data-testid=media-slider]')
        .find('[data-testid=title-card]')
        .first()
        .click();
      cy.get('[data-testid=media-title]').should('contain', text);
    });
};

describe('Discover', () => {
  beforeEach(() => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
    cy.visit('/');
  });

  it('loads a trending item', () => {
    clickFirstTitleCardInSlider('Trending');
  });

  it('loads popular movies', () => {
    clickFirstTitleCardInSlider('Popular Movies');
  });

  it('loads upcoming movies', () => {
    clickFirstTitleCardInSlider('Upcoming Movies');
  });

  it('loads popular series', () => {
    clickFirstTitleCardInSlider('Popular Series');
  });

  it('loads upcoming series', () => {
    clickFirstTitleCardInSlider('Upcoming Series');
  });
});
