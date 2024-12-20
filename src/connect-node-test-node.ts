import assert from 'node:assert';
import * as test from 'node:test';

import { API_NAME } from './shared';

import { connectTest } from './test';
import { Bridge } from './types';
import { RenderComponent } from './connect-app';

type Mock = test.TestContext['mock'];

export interface Rendered<PageType> {
  page: PageType;
  bridge: Bridge;
}

type GetPage<PageType> =
  /**
   * This should return the page object. It should also set up the API function
   *
   * For raw playwright that would look like this:
   * ```ts
   * getPage: async (fnName, fn, cleanup) => {
   *   //                                    Remove V       Remove V
   *   const importPlaywrightSafely = () => import(/#*@vite-ignore*#/`${'playwright'}`);
   *   //                                    Remove ^       Remove ^
   *
   *   const { chromium } = await importPlaywrightSafely();
   *   const browser = await chromium.launch({ headless: false });
   *
   *   cleanup(() => browser.close());
   *
   *   const page = await browser.newPage();
   *   await page.exposeFunction(fnName, fn);
   *   await page.goto('http://localhost:5173/');
   *   return page;
   * },
   * ```
   */
  (
    name: string,
    callback: Function,
    cleanup: (callback: () => Promise<void>) => void,
  ) => Promise<PageType>;

export interface Options {
  /**
   * The Location of client entry point that calls connectNodeTest. Usually
   * passed via something like `import.meta.resolve('../src/main.tsx')`.
   */
  bootstrappedAt: string;
  /** The absolute location of test file. Usually just `import.meta.url` */
  testFile: string;
}

export type NodeTestType<PageType, ComponentType> = ReturnType<
  typeof typeHelper<PageType, ComponentType>
>;
const typeHelper = <PageType, ComponentType>() => {
  type PageBound = ReturnType<typeof connectNodeTest<PageType>>;
  let pageBound: PageBound;
  type Returns = ReturnType<typeof pageBound<ComponentType>>;
  let returns: Returns;
  return returns!;
};

export const connectNodeTest =
  <PageType>(getPage: GetPage<PageType>) =>
  <ComponentType>({ bootstrappedAt, testFile }: Options) => {
    let bootstrap:
      | undefined
      | ((component: unknown) => Promise<Rendered<PageType>>);

    const render = async (
      component?: RenderComponent<ComponentType>,
    ): Promise<Rendered<PageType>> => {
      if (!bootstrap) {
        throw new Error('render can only be called inside a test');
      }
      const rendered = await bootstrap(component);
      return rendered;
    };

    const wrapTest = (original: typeof test.it) => {
      const wrapped: typeof test.it = async (...args) => {
        const name = args[0] as Extract<(typeof args)[0], string>;
        const opts = args[1] as Exclude<(typeof args)[0], string | Function>;
        const fn = args[2] as Extract<(typeof args)[0], Function>;
        const callback = typeof opts === 'function' ? opts : fn;
        const options = typeof opts === 'function' ? {} : opts;

        return original(name, options, async (...args) => {
          const context = args[0];

          bootstrap = async () => {
            const { render, handleMessage } = connectTest({
              bootstrappedAt,
              getTestInfo: async () => {
                context.filePath;
                const titlePath = context.fullName.split(' > ');
                return { file: testFile, titlePath };
              },
            });
            const cleanup = (cb: () => void) => context.after(() => cb());
            const page = await getPage(API_NAME, handleMessage, cleanup);
            const bridge = await render();

            return { page, bridge };
          };

          const returns = await callback?.(...args);
          bootstrap = undefined;
          return returns;
        });
      };
      if (false) {
        wrapped.only = it;
        wrapped.skip = it;
        wrapped.todo = it;
      }

      return wrapped;
    };

    const it = wrapTest(test.it);

    const manual = ['only', 'skip', 'todo'] as const;
    for (const key of manual) {
      it[key] = wrapTest(test.it[key] as never);
    }

    for (const [key, value] of Object.entries(test.it)) {
      const goodKey = key as keyof typeof it;
      if (!manual.includes(goodKey)) {
        const settingTo = typeof value === 'function' ? wrapTest(value) : value;
        it[goodKey] = settingTo;
      }
    }

    const { default: _ignore, ...restOfTest } = test;

    return {
      assert,
      render,
      ...restOfTest,
      mock: test.mock as Mock,
      it,
      test: it,
    };
  };
