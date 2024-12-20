/// <reference types="cypress" />
/// <reference types="cypress" preserve="true" />

import { APPLY, makeProxy } from './proxy';
import { state } from './browser';
import { Bridge, Payload } from './types';
import { connectTest } from './test';
import { API_NAME } from './shared';
import { RenderComponent } from './connect-app';

type Rendered = {
  /**
   * If you want to use the bridge you need to call make sure the test body is
   * sync and you'll chain off the render call as follows:
   *
   * ```ts
   * it('bridges', () => {
   *   render(<div />).then(async ({ bridge }) => {
   *     const bridged = await bridge(() => 'app', (app) => `${app} + runner`);
   *   });
   * });
   * ```
   */
  bridge: Bridge;
};
type Render<T> = (
  component?: RenderComponent<T>,
) => Cypress.Chainable<Rendered>;
type Connected<T> = typeof globalThis & { render: Render<T> };
type Options = {
  /** location of client entry point that calls connect */
  bootstrappedAt: string;
};

export type { Bridge, Rendered, Options };

export const isApp = !(window as any).describe;
export const isRunner = !isApp;
export const env = isApp ? 'app' : 'runner';

export const connectCypress = <T>({
  bootstrappedAt,
}: Options): Connected<T> => {
  if (isApp) {
    let bootstrap: (component: unknown) => Promise<{ bridge: Bridge }>;
    const testRun = (name: string, callback: Function) => {
      const full = `${state.currentSuite} ${name}`;
      state.tests[full] = async (options) => {
        bootstrap = options.bootstrap;
        callback();
      };
    };
    const describeRun = (name: string, callback: Function) => {
      const lastSuite = state.currentSuite;
      state.currentSuite += ` ${name}`;
      callback();
      state.currentSuite = lastSuite;
    };

    const fakeWindow: Connected<T> = makeProxy();
    const it = fakeWindow.it;
    (it as any)[APPLY] = testRun;
    (it.skip as any)[APPLY] = testRun;
    (it.only as any)[APPLY] = testRun;

    const describe = fakeWindow.describe;
    (describe as any)[APPLY] = describeRun;
    (describe.skip as any)[APPLY] = describeRun;
    (describe.only as any)[APPLY] = describeRun;

    const render: Render<T> = (component) => {
      if (!bootstrap) {
        throw new Error('render can only be called inside a test');
      }
      return bootstrap(component).then(({ bridge }) => ({ bridge })) as never;
    };

    fakeWindow.describe = describe;
    fakeWindow.it = it;
    fakeWindow.render = render;

    return fakeWindow;
  } else {
    const render = () => {
      const titlePath = Cypress.currentTest.titlePath;
      const info = { file: Cypress.spec.absolute, titlePath };

      const { render, handleMessage } = connectTest({
        bootstrappedAt,
        getTestInfo: async () => info,
      });

      const register = (win: Cypress.AUTWindow) => {
        (win as any)[API_NAME] = async (payload: Payload) => {
          const returns = await handleMessage(payload);
          return returns;
        };
      };

      const beforeLoad = `window:before:load`;
      Cypress.on(beforeLoad, register);
      Cypress.once('test:after:run', () => Cypress.off(beforeLoad, register));

      cy.visit('');

      return cy.wrap<Rendered>(
        render().then((bridge) => ({ bridge })) as never,
      );
    };
    return { ...window, render };
  }
};
