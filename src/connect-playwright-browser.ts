import { APPLY, makeProxy } from './proxy';
import { state } from './browser';

import type {
  Options,
  PlayType,
  Render,
  Rendered,
} from './connect-playwright-node';

import type { Bridge } from './types';

export type { Bridge, Render, Rendered, Options };

type PlaywrightBrowserCallbackArgs = { render: Render };

type Callback = (arg: PlaywrightBrowserCallbackArgs) => Promise<Rendered>;

export const connectPlaywright = <T>(_options: Options): PlayType<T> => {
  const playTest: PlayType<T> = makeProxy();

  const testRun = (name: string, callback: Callback) => {
    const full = `${state.currentSuite} ${name}`;
    state.tests[full] = (options) => callback({ render: options.bootstrap });
  };
  const describeRun = (name: string, callback: Function) => {
    const lastSuite = state.currentSuite;
    state.currentSuite += ` ${name}`;
    callback();
    state.currentSuite = lastSuite;
  };

  const test = playTest.test;

  (test as any)[APPLY] = testRun;
  (test.fail as any)[APPLY] = testRun;
  (test.fixme as any)[APPLY] = testRun;
  (test.skip as any)[APPLY] = testRun;
  (test.only as any)[APPLY] = testRun;

  const describe = test.describe;
  (describe as any)[APPLY] = describeRun;
  (describe.fixme as any)[APPLY] = describeRun;
  (describe.skip as any)[APPLY] = describeRun;
  (describe.only as any)[APPLY] = describeRun;
  (describe.parallel as any)[APPLY] = describeRun;
  (describe.parallel.only as any)[APPLY] = describeRun;
  (describe.serial as any)[APPLY] = describeRun;
  (describe.serial.only as any)[APPLY] = describeRun;

  return playTest;
};
