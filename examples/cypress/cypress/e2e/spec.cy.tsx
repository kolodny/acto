import React from 'react';
import { connectCypress } from 'acto/connect-cypress';

const { render, describe, it, cy } = connectCypress<React.ReactNode>({
  bootstrappedAt: '../../src/main.tsx',
});

describe('template spec', () => {
  describe('nested', () => {
    it('first test', () => {
      render(<div>My cool div</div>);

      cy.contains('My cool div').should('be.visible');
    });

    it('second test', () => {
      render(<div>My2 cool div</div>);

      cy.contains('My2 cool div').should('be.visible');
    });
    it('third test', () => {
      render(<div>My3 cool div</div>);

      cy.contains('My3 cool div').should('be.visible');
    });

    it('component test with stub', () => {
      const Component: React.FunctionComponent<{ handleClick: () => void }> = ({
        handleClick,
      }) => <div onClick={() => handleClick()}>Click me</div>;

      let stub = cy.stub();
      render(<Component handleClick={() => stub()} />).then(
        async ({ bridge }) => {
          const { runnerValue: runnerStub } = await bridge(null, () => stub);
          stub = runnerStub;

          cy.wrap(stub).its('callCount').should('eq', 0);
          cy.contains('Click me').click();
          cy.wrap(stub).its('callCount').should('eq', 1);
        },
      );
    });

    it('basic bridge', () => {
      render(<div>bridge test</div>).then(async ({ bridge }) => {
        cy.contains('bridge test').should('be.visible');

        const bridged = await bridge('app', (app) => `${app} + runner`);
        cy.wrap(bridged.browserValue).should('eq', 'app');
        cy.wrap(bridged.runnerValue).should('eq', 'app + runner');

        const windows = await bridge(window, () => window);
        const sameWindow = windows.browserValue === windows.runnerValue;
        cy.wrap(sameWindow).should('eq', false);
      });
    });

    // it('purposely failing test', () => {
    //   render(<div>This fails on purpose</div>);
    //   cy.contains('should fail', { timeout: 300 }).should('not.be.visible');
    // });

    it('app', () => {
      render();

      cy.contains('Vite + React').should('be.visible');
    });

    it('wraps app', () => {
      render((defaultElement) => defaultElement);

      cy.contains('Vite + React').should('be.visible');
    });
  });
});
