import { APPLY, makeProxy } from './proxy';
import { state } from './browser';

import type { NodeTestType, Options } from './connect-node-test-node';
import { Bridge } from './types';

export const connectNodeTest = <PageType, ComponentType = unknown>(
  _options: Options<PageType>,
): NodeTestType<PageType, ComponentType> => {
  const nodeTest: NodeTestType<PageType, ComponentType> = makeProxy();

  const testRun: typeof nodeTest.it = async (...args) => {
    const name = args[0] as Extract<(typeof args)[0], string>;
    const opts = args[1] as Exclude<(typeof args)[0], string | Function>;
    const fn = args[2] as Extract<(typeof args)[0], Function>;
    const callback = typeof opts === 'function' ? opts : fn;

    const full = `${state.currentSuite} ${name}`;
    const inject = makeProxy();
    state.tests[full] = async (options) => {
      bootstrap = options.bootstrap;
      return callback?.(inject, inject);
    };
  };
  if (false) {
    testRun.skip = testRun;
    testRun.only = testRun;
    testRun.todo = testRun;
  }

  const describeRun = (name: string, callback: Function) => {
    const lastSuite = state.currentSuite;
    state.currentSuite += ` ${name}`;
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
  const render = async (component?: ComponentType) => {
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
