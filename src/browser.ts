import { handleImporter, Importer } from './importer';
import { makeProxy } from './proxy';
import type { Payload } from './types';

export type Bootstrap<T> = (component?: unknown) => Promise<T>;

export type TestParam<T> = { bootstrap: Bootstrap<T> };
export type Test<T> = (testParams: TestParam<T>) => Promise<T>;
type Tests<T> = Record<string, Test<T>>;

interface State<T> {
  connected?: boolean;
  rendered?: any;
  tests: Tests<T>;
  currentSuite: string;
}

export const state: State<any> = { tests: {}, currentSuite: '' };

type CallTestRunner = (payload: Payload) => Promise<any>;
type Options<Rendered> = Importer & {
  render: (component: never) => Promise<Rendered>;
  defaultElement: unknown;
  callTestRunner: undefined | CallTestRunner;
};

type ImporterHandler = ReturnType<typeof handleImporter>;

const HASH = '__acto__';
const BRIDGE_SYNC = {};

type TestsInfo = Record<string, Array<{ href: string; title: string }>>;
const makeGetTestsInfo =
  (importerHandler: ImporterHandler) =>
  async (matcher?: (file: string) => boolean) => {
    const { known, importer } = importerHandler;
    const testsInfo: TestsInfo = {};
    for (const file of known) {
      if (matcher && !matcher(file)) {
        continue;
      }
      state.currentSuite = file;
      testsInfo[file] ??= [];
      await importer(file);
      let links = ``;
      for (const test of Object.keys(state.tests)) {
        if (test.startsWith(`${file} `)) {
          const title = test.split(' ').slice(1).join(' ');
          const href = `#${HASH}=${test}`;
          testsInfo[file].push({ title, href });
        }
      }
    }
    return testsInfo;
  };

const showDebugInfo = (testsInfo: TestsInfo) => {
  if (typeof document === 'undefined') {
    return;
  }

  const div = document.createElement('div');
  div.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 9999;
      `;
  for (const [file, tests] of Object.entries(testsInfo)) {
    state.currentSuite = file;
    const method =
      Object.keys(testsInfo).length > 5 ? 'groupCollapsed' : 'group';
    console[method](`Tests for ${file}`);
    let links = ``;
    for (const { title, href } of tests) {
      links += `<a target="_blank" href="${href}">${title}</a><br>`;
      console.log(
        `%c${title}`,
        'color: #fff; font-weight: bold',
        new URL(href, location.href).toString(),
      );
    }
    console.groupEnd();

    div.innerHTML += `
          <details style="cursor: pointer; padding: 8px; margin-left: 8px; background: black;">
            <summary>${file}</summary>
            ${links}
          </details>
        `;
  }
  document.body.appendChild(div);
};

export const getInfoFromHash = () => {
  const hash = location.hash;
  if (hash.includes(`${HASH}=`)) {
    // HASH is #__acto__=testName
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    const value = params.get(HASH)!;
    const file = value.split(' ')[0];
    return { file, test: value };
  }
  return null;
};

export const getTestInfo = (callTestRunner: CallTestRunner) => {
  const infoFromHash = getInfoFromHash();
  if (!infoFromHash && !callTestRunner) {
    return null;
  }

  return (async () => {
    return (
      infoFromHash || ((await callTestRunner?.({ type: 'INIT' })) as never)
    );
  })();
};

export const connectBrowser = <Rendered>(options: Options<Rendered>) => {
  const { render, defaultElement: app, callTestRunner } = options;

  const getValue = (o: unknown, arg?: unknown) => {
    return typeof o === 'function' ? o(arg) : o;
  };

  const bootstrap = async (component: unknown) => {
    const isWrapper = typeof component === 'function';
    const rendering = isWrapper ? component(app) : component || app;
    state.rendered = await render((await rendering) as never);
    await callTestRunner?.({ type: 'READY' });
    const rendered = await makeProxy();
    const rawBridge = async (browserValue: any) => {
      browserValue = await getValue(await browserValue);

      const runnerValue = await callTestRunner?.({
        type: 'BRIDGE',
        browserValue,
      });
      return { browserValue, runnerValue, value: browserValue };
    };

    rendered.bridge = async (browserValue: any, passedRunnerValue: any) => {
      // We call this twice to ensure that the browser and runner are synced.
      await rawBridge(BRIDGE_SYNC);

      if (!callTestRunner) {
        const whenFn = (x: unknown) => typeof x === 'function' && x;
        const anyFunction = whenFn(browserValue) || whenFn(passedRunnerValue);

        const message =
          "Bridge function was called, however the there's no active test runner. You'll need to play the part of the test runner, you can manually call the bridge function. eg: `bridge(browserValue => browserValue.toUpperCase())`";
        if (anyFunction) {
          console.log(
            `${message}. Waiting to resolve the following (you can click this to go to source):`,
            anyFunction,
          );
        } else {
          console.log(message);
        }

        return new Promise((resolve) => {
          (window as any).bridge = async (runnerValue: (value: any) => any) => {
            delete (window as any).bridge;

            browserValue = await getValue(await browserValue);
            runnerValue = await getValue(runnerValue, browserValue);

            const returns = { browserValue, runnerValue, value: browserValue };
            resolve(returns);
            return returns;
          };
        });
      }
      return await rawBridge(browserValue);
    };

    return rendered;
  };

  const importAdapter = handleImporter(options);

  let info: null | { file: string; test: string } = null;

  const getTestsInfo = makeGetTestsInfo(importAdapter);

  const connect = async () => {
    const hash = typeof location !== 'undefined' ? location.hash : '';
    if (hash.includes(HASH)) {
      if (!hash.includes(`${HASH}=`)) {
        // HASH is just #__acto__
        const testsInfo = await getTestsInfo();
        showDebugInfo(testsInfo);
      } else {
        // HASH is #__acto__=testName
        info = getInfoFromHash();
      }
    }

    info ||= await callTestRunner?.({ type: 'INIT' });

    if (info && importAdapter) {
      state.currentSuite = info.file;
      await importAdapter.importer(info.file);

      return { testInfo: info, bootstrap, test: state.tests[info.test] };
    } else {
      return { defaultRender: await render(app as never) };
    }
  };

  return { connected: connect(), getTestsInfo };
};
