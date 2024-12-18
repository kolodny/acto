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

type Options<Rendered> = Importer & {
  render: (component: never) => Promise<Rendered>;
  defaultElement: unknown;
  callTestRunner: (payload: Payload) => Promise<any>;
};

const HASH = '__acto__';

export const connectBrowser = async <Rendered>(options: Options<Rendered>) => {
  const { render, defaultElement, callTestRunner } = options;

  const bootstrap = async (component = defaultElement) => {
    const isWrapper = typeof component === 'function' && component.length === 1;
    const rendering = isWrapper ? await component(defaultElement) : component;
    await render(rendering as never);
    await callTestRunner({ type: 'READY' });
    const rendered = await makeProxy();
    const rawBridge = async (browserValue: any) => {
      if (typeof browserValue === 'function') {
        browserValue = browserValue();
      }
      const runnerValue = await callTestRunner({
        type: 'BRIDGE',
        browserValue,
      });
      return { browserValue, runnerValue };
    };
    rendered.bridge = async (browserValue: any) => {
      // We call this twice to ensure that the browser and runner are synced.
      await rawBridge(null);
      return rawBridge(browserValue);
    };

    return rendered;
  };

  const { known, importer } = handleImporter(options);

  let info: null | { file: string; test: string } = null;

  const hash = location.hash;
  if (hash.includes(HASH)) {
    if (!hash.includes(`${HASH}=`)) {
      // HASH is just #__acto__
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
    } else {
      // HASH is #__acto__=testName
      const params = new URLSearchParams(location.hash.replace(/^#/, ''));
      const value = params.get(HASH)!;
      const file = value.split(' ')[0];
      info = { file, test: value };
    }
  }

  info ||= await callTestRunner({ type: 'INIT' });

  if (info && importer) {
    state.currentSuite = info.file;
    await importer(info.file);

    return { testInfo: info, bootstrap, test: state.tests[info.test] };
  } else {
    return { defaultRender: await render(defaultElement as never) };
  }
};
