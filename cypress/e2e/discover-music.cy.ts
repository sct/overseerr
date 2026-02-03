describe('Discover Music', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('loads discover artists page', () => {
    cy.intercept('/api/v1/discover/artists*').as('getArtists');
    cy.intercept('/api/v1/discover/artists/popular').as('getPopularArtists');
    cy.intercept('/api/v1/discover/tracks/popular').as('getPopularTracks');
    cy.visit('/discover/artists');
    cy.wait('@getArtists');
    cy.wait('@getPopularArtists');
    cy.wait('@getPopularTracks');

    cy.contains('Artists').should('be.visible');
    cy.contains('Trending Artists').should('be.visible');
    cy.contains('Trending Songs').should('be.visible');
  });

  it('loads discover albums page', () => {
    cy.intercept('/api/v1/discover/albums*').as('getAlbums');
    cy.intercept('/api/v1/discover/albums/popular').as('getPopularAlbums');
    cy.visit('/discover/albums');
    cy.wait('@getAlbums');
    cy.wait('@getPopularAlbums');

    cy.contains('Albums').should('be.visible');
    cy.contains('Trending Albums').should('be.visible');
  });
});
