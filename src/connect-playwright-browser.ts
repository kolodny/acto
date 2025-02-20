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
  if (!state.connected) {
    console.error(`You app is importing tests even when not under test!`);
  }

  const file = state.currentFile;
  const playTest: PlayType<T> = makeProxy();

  const testRun = (name: string, callback: Callback) => {
    const full = [file, state.currentSuite, name].filter(Boolean).join(' ');
    state.tests[full] = {
      fn: (options) => callback({ render: options.bootstrap }),
      config: state.config,
    };
  };
  const describeRun = (name: string, callback: Function) => {
    const lastSuite = state.currentSuite;
    const lastConfig = state.config;

    state.currentSuite = [state.currentSuite, name].filter(Boolean).join(' ');
    callback();

    state.currentSuite = lastSuite;
    state.config = lastConfig;
  };

  const test = playTest.test;
  test.use = (config) => {
    state.config = { ...state.config, ...config };
  };

  (test as any)[APPLY] = testRun;
  (test.fail as any)[APPLY] = testRun;
  (test.fixme as any)[APPLY] = testRun;
  (test.skip as any)[APPLY] = testRun;
  (test.only as any)[APPLY] = testRun;

  (test.extend as any)[APPLY] = () => test;

  const describe = test.describe;
  (describe as any)[APPLY] = describeRun;
  (describe.fixme as any)[APPLY] = describeRun;
  (describe.skip as any)[APPLY] = describeRun;
  (describe.only as any)[APPLY] = describeRun;
  (describe.parallel as any)[APPLY] = describeRun;
  (describe.parallel.only as any)[APPLY] = describeRun;
  (describe.serial as any)[APPLY] = describeRun;
  (describe.serial.only as any)[APPLY] = describeRun;

  // Handle case of: const { test, expect } = await connectPlaywright();
  const playTestAny = playTest as any;
  playTestAny.then = (resolve: any) => {
    const then = playTestAny.then;
    playTestAny.then = undefined;
    resolve(playTest);
    playTestAny.then = then;
  };

  return playTest;
};

export const env: 'runner' | 'app' = 'app';
export const isRunner: boolean = false;
export const isApp: boolean = true;
