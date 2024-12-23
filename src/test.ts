import { withResolvers } from './promise-resolvers';
import { Bridge, Payload } from './types';

const getRelativeTestFile = (test: string, boot: string) => {
  const testFile = new URL(test, 'file://');
  const testAbsolute = testFile.pathname;
  const bootAbsolute = new URL(boot, testFile).pathname;
  const testParts = testAbsolute.split('/');
  const bootParts = bootAbsolute.split('/');
  let common = 0;
  while (testParts[common] === bootParts[common]) {
    common++;
  }
  const relativeParts: string[] = [];
  for (let i = common; i < bootParts.length - 1; i++) {
    relativeParts.push('..');
  }
  for (let i = common; i < testParts.length; i++) {
    relativeParts.push(testParts[i]);
  }
  return relativeParts.join('/');
};

interface Options {
  /** location of client entry point that calls connect */
  bootstrappedAt: string;
  getTestInfo: () => Promise<{ file: string; titlePath: string[] }>;
}

export const connectTest = ({ bootstrappedAt, getTestInfo }: Options) => {
  let componentReady$ = withResolvers<void>();
  let runnerValue$ = withResolvers();
  let browserValue$ = withResolvers();
  const handleMessage = async (payload: Payload) => {
    if (payload.type === 'INIT') {
      const testInfo = await getTestInfo();
      const file = getRelativeTestFile(testInfo.file, bootstrappedAt);
      const test = [file, ...testInfo.titlePath].join(' ');
      return { file, test };
    } else if (payload.type === 'READY') {
      componentReady$?.resolve();
    } else if (payload.type === 'BRIDGE') {
      browserValue$?.resolve(payload.browserValue);
      const runnerValue = await runnerValue$?.promise;
      runnerValue$ = withResolvers();
      return runnerValue;
    } else {
      throw new Error(`Unknown payload ${JSON.stringify(payload)}`);
    }
  };
  const render = async () => {
    await componentReady$?.promise;

    const rawBridge = (async (_browserValueCallback, runnerValueCallback) => {
      const browserValue = await browserValue$?.promise;
      browserValue$ = withResolvers();
      const runnerValue =
        typeof runnerValueCallback === 'function'
          ? await (runnerValueCallback as any)(browserValue)
          : runnerValueCallback;

      runnerValue$?.resolve(runnerValue);
      return { browserValue, runnerValue, value: runnerValue };
    }) as Bridge;

    const bridge: Bridge = async (
      browserValueCallback,
      runnerValueCallback,
    ) => {
      // We call this twice to ensure that the browser and runner are synced.
      await rawBridge(null, null);
      return rawBridge(browserValueCallback, runnerValueCallback);
    };

    return bridge;
  };
  return { render, handleMessage };
};
