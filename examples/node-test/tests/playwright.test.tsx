import React from 'react';
import sinon from 'sinon';
import { type Page } from 'playwright';
import { connectNodeTest } from 'acto/connect-node-test';

const importPlaywright = (): Promise<typeof import('playwright')> =>
  import(/* @vite-ignore */ `${'playwright'}`) as never;

const { describe, it, test, render, assert } = connectNodeTest<
  Page,
  React.ReactNode
>({
  bootstrappedAt: import.meta.resolve('../src/main.tsx'),
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

describe('playwright tests', () => {
  it('app test', async () => {
    const { page } = await render();
    await page.getByText('Vite + React').waitFor();
  });

  it('app test2', async () => {
    const { page } = await render();
    await page.getByText('Vite + React').waitFor();
  });

  it('component test', async () => {
    const { page } = await render(<div>Custom</div>);
    await page.getByText('Custom').waitFor();
  });

  test('state', async () => {
    const { page } = await render();
    await page.getByText('count is 0').waitFor();
    await page.getByText('count is 0').click();
    await page.getByText('count is 1').waitFor();
  });
});

describe('nested1', () => {
  describe('nested2', () => {
    it('nested3', async (t) => {
      t.runOnly(true);
      const { page } = await render(<div>Nested</div>);
      const url = page.url();
      console.log({ url: `${url}` });
      await page.getByText('Nested').waitFor();
    });
  });
});

it('bridge', async () => {
  // await new Promise((res) => setTimeout(res, 3000));
  const { page, bridge } = await render(<div>Test</div>);
  await new Promise((r) => setTimeout(r, 100));
  await page.getByText('Test').waitFor();
  await new Promise((r) => setTimeout(r, 100));

  const stuff = await bridge(null, () => typeof process);
  await new Promise((r) => setTimeout(r, 100));

  console.log({ stuff });

  const stuff2 = await bridge({ b: typeof process }, (b) => ({ b }));
  await new Promise((r) => setTimeout(r, 100));
  const { runnerValue: env } = await bridge(
    null,
    () => `${process.env.NODE_TEST_CONTEXT}`,
  );
  console.log({ env });
  assert.equal(env, 'child-v8');
  const fixed = await bridge(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    () => ({ foo: window.location.href }),
    (a) => a,
  );
  await new Promise((r) => setTimeout(r, 100));
  console.log({ stuff2, fixed });
  await bridge(null, () => {});
});

it('stub', async () => {
  const Component: React.FunctionComponent<{ handleClick: () => void }> = ({
    handleClick,
  }) => <div onClick={handleClick}>Click me</div>;
  const stub = sinon.stub();
  const { page, bridge } = await render(<Component handleClick={stub} />);

  const callCount = () => stub.callCount;
  const getCallCount = async () => bridge(callCount, callCount);
  const browserCallCount = async () => (await getCallCount()).browserValue;
  const called0 = await browserCallCount();
  console.log({ called0 });
  await page.click('text=Click me');
  const called1 = await browserCallCount();
  console.log({ called1 });
  await page.click('text=Click me');
  assert.equal(called1, 1);
});
