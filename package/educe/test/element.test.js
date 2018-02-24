import {n, Element} from '../index.js';

describe('Element', () => {
  it('basic', () => {
    cy.visit('http://localhost:8080/package/educe/fixtures/basic.html');

    cy.get('test-elem').contains('Hello World!');
  });

  it('listeners', () => {
    cy.visit('http://localhost:8080/package/educe/fixtures/listeners.html');

    cy.get('test-clicked').contains('Clicked 0 times');
    cy.get('test-clicked').click().contains('Clicked 1 times');
    cy.get('test-clicked').click().contains('Clicked 2 times');

    cy.get('test-reset').click();

    cy.get('test-clicked').contains('Clicked 0 times');
  });
});
