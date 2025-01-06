import { handleImporter, Importer } from './importer';
import { makeProxy } from './proxy';
import type { Payload } from './types';

export type Bootstrap<T> = (component?: unknown) => Promise<T>;

export type TestParam<T> = { bootstrap: Bootstrap<T> };
export type Test<T> = (testParams: TestParam<T>) => Promise<T>;
type Tests<T> = Record<string, Test<T>>;

interface State<T> {
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

const HASH = '__acto__';
const BRIDGE_SYNC = {};

const showDebugInfo = async (
  importerHandler: ReturnType<typeof handleImporter>,
) => {
  if (typeof document === 'undefined') {
    return;
  }

  const { known, importer } = importerHandler;
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
  for (const file of known) {
    state.currentSuite = file;
    await importer(file);
    const method = known.length > 5 ? 'groupCollapsed' : 'group';
    console[method](`Tests for ${file}`);
    let links = ``;
    for (const test of Object.keys(state.tests)) {
      if (test.startsWith(`${file} `)) {
        const title = test.split(' ').slice(1).join(' ');
        const href = `#${HASH}=${test}`;
        links += `<a target="_blank" href="${href}">${title}</a><br>`;
        console.log(
          `%c${title}`,
          'color: #fff; font-weight: bold',
          new URL(href, location.href).toString(),
        );
      }
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
    return infoFromHash || (await callTestRunner?.({ type: 'INIT' })) || null;
  })();
};

export const connectBrowser = async <Rendered>(options: Options<Rendered>) => {
  const { render, defaultElement: app, callTestRunner } = options;

  const getValue = (o: unknown, arg?: unknown) => {
    return typeof o === 'function' ? o(arg) : o;
  };

  const bootstrap = async (component: unknown) => {
    const isWrapper = typeof component === 'function';
    const rendering = isWrapper ? await component(app) : component || app;
    await render(rendering as never);
    await callTestRunner?.({ type: 'READY' });
    const rendered = await makeProxy();
    const rawBridge = async (browserValue: any, passedRunnerValue: any) => {
      browserValue = await getValue(await browserValue);

      if (!callTestRunner && browserValue !== BRIDGE_SYNC) {
        const whenFn = (x: unknown) => typeof x === 'function' && x;
        const anyFunction = whenFn(browserValue) || whenFn(passedRunnerValue);

        const message =
          "Bridge function was called, however the there's no active test runner. You'll need to play the part of the test runner, you can manually call the bridge function. eg: `bridge(browserValue => browserValue.toUpperCase())`";
        if (anyFunction) {
          console.info(
            `${message}. Waiting to resolve the following (you can click this to go to source):`,
            anyFunction,
          );
        } else {
          console.log(message);
        }

        return new Promise((resolve) => {
          (window as any).bridge = async (runnerValue: (value: any) => any) => {
            delete (window as any).bridge;

            runnerValue = await getValue(runnerValue, browserValue);

            resolve(runnerValue);
            return { browserValue, runnerValue, value: runnerValue };
          };
        });
      }

      const runnerValue = await callTestRunner?.({
        type: 'BRIDGE',
        browserValue,
      });
      return { browserValue, runnerValue, value: browserValue };
    };
    rendered.bridge = async (browserValue: any, passedRunnerValue: any) => {
      // We call this twice to ensure that the browser and runner are synced.
      await rawBridge(BRIDGE_SYNC, null);
      return await rawBridge(browserValue, passedRunnerValue);
    };

    return rendered;
  };

  const { known, importer } = handleImporter(options);

  let info: null | { file: string; test: string } = null;

  const hash = typeof location !== 'undefined' ? location.hash : '';
  if (hash.includes(HASH)) {
    if (!hash.includes(`${HASH}=`)) {
      // HASH is just #__acto__
      await showDebugInfo({ known, importer });
    } else {
      // HASH is #__acto__=testName
      info = getInfoFromHash();
    }
  }

  info ||= await callTestRunner?.({ type: 'INIT' });

  if (info && importer) {
    state.currentSuite = info.file;
    await importer(info.file);

    return { testInfo: info, bootstrap, test: state.tests[info.test] };
  } else {
    return { defaultRender: await render(app as never) };
  }
};
