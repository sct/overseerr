describe('Album Details', () => {
  it('loads an album details page', () => {
    cy.loginAsAdmin();
    // Abbey Road by The Beatles - MusicBrainz release group MBID
    cy.visit('/album/9162580e-5df4-32de-80cc-f45a8d8a9b1d');

    cy.get('[data-testid=media-title]').should('contain', 'Abbey Road');
  });
});
