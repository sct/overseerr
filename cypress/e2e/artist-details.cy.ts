describe('Artist Details', () => {
  it('loads an artist details page', () => {
    cy.loginAsAdmin();
    // The Beatles - MusicBrainz artist MBID
    cy.visit('/artist/b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d');

    cy.get('[data-testid=media-title]').should('contain', 'The Beatles');
  });
});
