import { APPLY, makeProxy } from './proxy';
import { state } from './browser';

import type {
  Options,
  Rendered,
  connectNodeTest as nodeConnect,
  NodeTestType,
} from './connect-node-test-node';
import { Bridge } from './types';
import { RenderComponent } from './connect-app';

export type { Bridge, Rendered, Options, NodeTestType };

export const connectNodeTest: typeof nodeConnect = (_render) => (_options) => {
  if (!state.connected) {
    console.error(`You app is importing tests even when not under test!`);
  }

  const file = state.currentFile;
  const nodeTest = makeProxy();

  const testRun: typeof nodeTest.it = async (...args: unknown[]) => {
    const name = args[0] as Extract<(typeof args)[0], string>;
    const opts = args[1] as Exclude<(typeof args)[0], string | Function>;
    const fn = args[2] as Extract<(typeof args)[0], Function>;
    const callback = typeof opts === 'function' ? opts : fn;

    const full = [file, state.currentSuite, name].filter(Boolean).join(' ');
    const inject = makeProxy();
    state.tests[full] = {
      config: state.config,
      fn: async (options) => {
        bootstrap = options.bootstrap;
        return callback?.(inject, inject);
      },
    };
  };
  if (false) {
    testRun.skip = testRun;
    testRun.only = testRun;
    testRun.todo = testRun;
  }

  const describeRun = (name: string, callback: Function) => {
    const lastSuite = state.currentSuite;
    state.currentSuite = [state.currentSuite, name].filter(Boolean).join(' ');
    callback();
    state.currentSuite = lastSuite;
  };

  const it = nodeTest.it;
  nodeTest.it = nodeTest.test = it;

  (it as any)[APPLY] = testRun;
  (it.only as any)[APPLY] = testRun;
  (it.skip as any)[APPLY] = testRun;
  (it.todo as any)[APPLY] = testRun;

  const describe = nodeTest.describe;
  (describe as any)[APPLY] = describeRun;
  (describe.todo as any)[APPLY] = describeRun;
  (describe.skip as any)[APPLY] = describeRun;
  (describe.only as any)[APPLY] = describeRun;

  let bootstrap: (component: unknown) => Promise<{ bridge: Bridge }>;
  const render = async (component?: RenderComponent<unknown>) => {
    if (!bootstrap) {
      throw new Error('render can only be called inside a test');
    }
    const page = makeProxy();
    const { bridge } = await bootstrap(component);
    return { page, bridge };
  };
  nodeTest.render = render;

  return nodeTest;
};

export const env: 'runner' | 'app' = 'app';
export const isRunner: boolean = false;
export const isApp: boolean = true;
