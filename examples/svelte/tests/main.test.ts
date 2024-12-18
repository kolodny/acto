import { connectNodeTest } from 'acto/connect-node-test';

const importPlaywright = (): Promise<typeof import('playwright')> =>
  import(/* @vite-ignore */ `${'playwright'}`) as never;

const { describe, it, test, render, assert } = connectNodeTest({
  bootstrappedAt: import.meta.resolve('../src/main.ts'),
  testFile: import.meta.url,
  getPage: async (fnName, fn, cleanup) => {
    const { chromium } = await importPlaywright();
    const browser = await chromium.launch();

    cleanup(() => browser.close());

    const page = await browser.newPage();
    await page.exposeFunction(fnName, fn);
    await page.goto('http://localhost:5173/');
    return page;
  },
});

describe('Svelte tests', () => {
  it('tests app', async () => {
    const { page } = await render();
    await page.getByText('Vite + Svelte').waitFor();
  });

  it('tests component', async () => {
    const Counter = () =>
      // @ts-ignore
      import('../src/lib/Counter.svelte').then((m) => m.default);
    const { page } = await render(Counter);
    await page.getByText('count is 0').waitFor();
    await page.getByText('count is 0').click();
    await page.getByText('count is 1').waitFor();
  });
});
