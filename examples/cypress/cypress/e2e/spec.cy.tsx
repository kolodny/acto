import React from 'react';
import { connectCypress, env, isApp, isRunner } from 'acto/connect-cypress';

import type { ElementType } from '../../src/main';

const { render, describe, it, cy } = connectCypress<ElementType>({
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

        const bridged = await bridge(env, (app) => `${app} + ${env}`);
        cy.wrap(bridged.browserValue).should('eq', 'app');
        cy.wrap(bridged.runnerValue).should('eq', 'app + runner');

        const items = [isApp, isRunner];
        const bridged2 = await bridge([items], (app) => app.concat([items]));
        cy.wrap(bridged2.runnerValue).should('deep.equal', [
          [true, false],
          [false, true],
        ]);

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
