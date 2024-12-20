import { connectNodeTest } from 'acto/connect-node-test';
import type { ElementType } from '../src/main';
const bootstrappedAt = import.meta.resolve('../src/main'); // Should match last line

const importPlaywright = (): Promise<typeof import('playwright')> =>
  import(/* @vite-ignore */ `${'playwright'}`) as never;

const connectedRender = connectNodeTest(async (fnName, fn, cleanup) => {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch();

  cleanup(() => browser.close());

  const page = await browser.newPage();
  await page.exposeFunction(fnName, fn);
  await page.goto('http://localhost:5173/');
  return page;
});

const { describe, it, test, render, assert } = connectedRender<ElementType>({
  bootstrappedAt,
  testFile: import.meta.url,
});

describe('Vue tests', () => {
  it('tests app', async () => {
    const { page } = await render();
    await page.getByText('Vite + Vue').waitFor();
  });

  it('tests app wrap', async () => {
    const { page } = await render((app) => app);
    await page.getByText('Vite + Vue').waitFor();
  });

  it('tests component', async () => {
    const Counter: ElementType = () =>
      import('../src/components/HelloWorld.vue').then((m) => m.default);
    const { page } = await render(() => Counter);
    await page.getByText('count is 0').waitFor();
    await page.getByText('count is 0').click();
    await page.getByText('count is 1').waitFor();
  });
});
