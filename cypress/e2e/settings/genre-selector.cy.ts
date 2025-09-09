describe('Genre Selector', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.intercept('/api/v1/genres/movie').as('getMovieGenres');
    cy.intercept('/api/v1/genres/tv').as('getTvGenres');
    cy.intercept('/api/v1/settings/main').as('getMainSettings');
    cy.intercept('/api/v1/settings/discover').as('getDiscoverSettings');
    cy.visit('/settings/discover');
    cy.wait([
      '@getMovieGenres',
      '@getTvGenres',
      '@getMainSettings',
      '@getDiscoverSettings',
    ]);
  });

  describe('Basic functionality', () => {
    it('displays the genre selector in discover settings', () => {
      cy.get('[data-testid="genre-selector"]').should('be.visible');
    });

    it('shows "No Exclusions" option by default', () => {
      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.contains('No Exclusions').should('be.visible');
      });
    });

    it('opens dropdown when clicked', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__menu').should('be.visible');
      cy.get('.react-select__option').should('have.length.greaterThan', 2);
    });
  });

  describe('Genre selection', () => {
    it('can select a single genre', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Action').click();

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.contains('Action').should('be.visible');
        cy.contains('No Exclusions').should('not.exist');
      });
    });

    it('can select multiple genres', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Action').click();

      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Comedy').click();

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.contains('Action').should('be.visible');
        cy.contains('Comedy').should('be.visible');
      });
    });

    it('can remove selected genres', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Action').click();

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.get('.react-select__multi-value__remove').click();
      });

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.contains('Action').should('not.exist');
        cy.contains('No Exclusions').should('be.visible');
      });
    });

    it('can clear all selections by selecting "No Exclusions"', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Action').click();

      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Comedy').click();

      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('No Exclusions').click();

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.contains('Action').should('not.exist');
        cy.contains('Comedy').should('not.exist');
        cy.contains('No Exclusions').should('be.visible');
      });
    });
  });

  describe('User settings mode', () => {
    beforeEach(() => {
      cy.loginAsUser();
      cy.intercept('/api/v1/auth/me').as('getUser');
      cy.intercept('/api/v1/user/*/settings/main').as('getUserSettings');
      cy.visit('/profile/settings');
      cy.wait([
        '@getUser',
        '@getUserSettings',
        '@getMovieGenres',
        '@getTvGenres',
      ]);
    });

    it('displays server default option in user settings', () => {
      cy.get('[data-testid="user-genre-selector"]').should('be.visible');
      cy.get('[data-testid="user-genre-selector"]').click();

      cy.get('.react-select__option').contains('Default').should('be.visible');
    });

    it('can select server default', () => {
      cy.get('[data-testid="user-genre-selector"]').click();
      cy.get('.react-select__option').contains('Default').click();

      cy.get('[data-testid="user-genre-selector"]').within(() => {
        cy.contains('Default').should('be.visible');
      });
    });

    it('cannot remove server default option', () => {
      cy.get('[data-testid="user-genre-selector"]').click();
      cy.get('.react-select__option').contains('Default').click();

      cy.get('[data-testid="user-genre-selector"]').within(() => {
        cy.get('.react-select__multi-value__remove').should('not.exist');
      });
    });
  });

  describe('Persistence', () => {
    it('saves and persists genre exclusions', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Action').click();

      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Horror').click();

      cy.intercept('POST', '/api/v1/settings/discover').as(
        'saveDiscoverSettings'
      );
      cy.get('[data-testid="discover-settings-save"]').click();
      cy.wait('@saveDiscoverSettings');

      cy.reload();
      cy.wait(['@getMovieGenres', '@getTvGenres', '@getDiscoverSettings']);

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.contains('Action').should('be.visible');
        cy.contains('Horror').should('be.visible');
      });
    });

    it('persists "No Exclusions" selection', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Action').click();

      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('No Exclusions').click();

      cy.intercept('POST', '/api/v1/settings/discover').as(
        'saveDiscoverSettings'
      );
      cy.get('[data-testid="discover-settings-save"]').click();
      cy.wait('@saveDiscoverSettings');

      cy.reload();
      cy.wait(['@getMovieGenres', '@getTvGenres', '@getDiscoverSettings']);

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.contains('No Exclusions').should('be.visible');
      });
    });
  });

  describe('Genre filtering behavior', () => {
    it('excludes selected genres from discover results', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('Horror').click();

      cy.intercept('POST', '/api/v1/settings/discover').as(
        'saveDiscoverSettings'
      );
      cy.get('[data-testid="discover-settings-save"]').click();
      cy.wait('@saveDiscoverSettings');

      cy.visit('/');
      cy.intercept('/api/v1/discover/movies/popular*').as('getPopularMovies');
      cy.wait('@getPopularMovies');

      cy.get('[data-testid="title-card"]').first().click();
      cy.get('[data-testid="movie-details"]').should('be.visible');

      cy.get('[data-testid="genre-tag"]').should('not.contain', 'Horror');
    });

    it('shows all genres when "No Exclusions" is selected', () => {
      cy.get('[data-testid="genre-selector"]').click();
      cy.get('.react-select__option').contains('No Exclusions').click();

      cy.intercept('POST', '/api/v1/settings/discover').as(
        'saveDiscoverSettings'
      );
      cy.get('[data-testid="discover-settings-save"]').click();
      cy.wait('@saveDiscoverSettings');

      cy.visit('/');
      cy.intercept('/api/v1/discover/movies/popular*').as('getPopularMovies');
      cy.wait('@getPopularMovies');

      cy.get('[data-testid="title-card"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Accessibility', () => {
    it('is keyboard navigable', () => {
      cy.get('[data-testid="genre-selector"]').focus();
      cy.focused().type('{downarrow}');

      cy.get('.react-select__menu').should('be.visible');

      cy.focused().type('{downarrow}');
      cy.focused().type('{enter}');

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.get('.react-select__multi-value').should('be.visible');
      });
    });

    it('has proper ARIA attributes', () => {
      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.get('[role="combobox"]').should('exist');
        cy.get('[aria-expanded="false"]').should('exist');
      });

      cy.get('[data-testid="genre-selector"]').click();

      cy.get('[data-testid="genre-selector"]').within(() => {
        cy.get('[aria-expanded="true"]').should('exist');
      });
    });
  });

  describe('Error handling', () => {
    it('handles API failures gracefully', () => {
      cy.intercept('/api/v1/genres/movie', { statusCode: 500 }).as(
        'getMovieGenresError'
      );
      cy.intercept('/api/v1/genres/tv', { statusCode: 500 }).as(
        'getTvGenresError'
      );

      cy.reload();
      cy.wait(['@getMovieGenresError', '@getTvGenresError']);

      cy.get('[data-testid="genre-selector"]').should('be.visible');
      cy.get('[data-testid="genre-selector"]').click();

      cy.get('.react-select__option')
        .contains('No Exclusions')
        .should('be.visible');
    });

    it('handles invalid genre data', () => {
      cy.intercept('/api/v1/genres/movie', { body: [] }).as(
        'getEmptyMovieGenres'
      );
      cy.intercept('/api/v1/genres/tv', { body: [] }).as('getEmptyTvGenres');

      cy.reload();
      cy.wait(['@getEmptyMovieGenres', '@getEmptyTvGenres']);

      cy.get('[data-testid="genre-selector"]').should('be.visible');
      cy.get('[data-testid="genre-selector"]').click();

      cy.get('.react-select__option')
        .contains('No Exclusions')
        .should('be.visible');
    });
  });
});
