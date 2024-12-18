import React from 'react';
// import { test, expect } from '@playwright/test';
import { connectPlaywright } from 'acto/connect-playwright';
import sinon from 'sinon';

const { test, expect } = connectPlaywright<JSX.Element>({
  bootstrappedAt: import.meta.resolve('../src/main.tsx'),
});

test('app test', async ({ render }) => {
  const { page } = await render();
  await expect(page.getByText('Vite + React')).toBeVisible();
});

test('app test2', async ({ page, render }) => {
  await render();
  await expect(page.getByText('Vite + React')).toBeVisible();
});

test('app test wrap', async ({ render }) => {
  const { page } = await render((defaultElement) => defaultElement);
  await expect(page.getByText('Vite + React')).toBeVisible();
});

test('component test', async ({ render }) => {
  const { page } = await render(<div>Custom</div>);
  await expect(page.getByText('Custom')).toBeVisible();
});

test('state', async ({ render }) => {
  const { page } = await render();
  await expect(page.getByText('count is 0')).toBeVisible();
  await page.getByText('count is 0').click();
  await expect(page.getByText('count is 1')).toBeVisible();
});

test.fail('failing test', async ({ render }) => {
  const { page } = await render();
  test.fixme();
  await expect(page.getByText('Nope')).toBeVisible();
});

test.fixme('fixer', async ({ render }) => {
  const { page } = await render();
  await expect(page.getByText('Nope')).toBeVisible();
});

test.describe('nested1', () => {
  test.describe('nested2', () => {
    test('nested3', async ({ render }) => {
      const { page } = await render(<div>Nested</div>);
      expect(page).toBeDefined();
      const url = page.url();
      console.log({ url: `${url}` });
      await expect(page.getByText('Nested')).toBeVisible();
    });
  });
});

test('bridge', async ({ render }) => {
  // await new Promise((res) => setTimeout(res, 3000));
  const { page, bridge } = await render(<div>Test</div>);
  await new Promise((r) => setTimeout(r, 100));
  await expect(page.getByText('Test')).toBeVisible();
  await new Promise((r) => setTimeout(r, 100));

  const stuff = await bridge(null, () => typeof process);
  await new Promise((r) => setTimeout(r, 100));

  console.log({ stuff });

  const stuff2 = await bridge({ b: typeof process }, (b) => ({ b }));
  await new Promise((r) => setTimeout(r, 100));
  const { runnerValue: env } = await bridge(
    null,
    () => `${process.env.PWDEBUG}`,
  );
  console.log({ env });
  const fixed = await bridge(
    () => ({ foo: window.location.href }),
    (a) => a,
  );
  await new Promise((r) => setTimeout(r, 100));
  console.log({ stuff2, fixed });
  await bridge(null, () => {});
});

test('bridge value', async ({ render }) => {
  // await new Promise((res) => setTimeout(res, 3000));
  const { page, bridge } = await render(<div>Test</div>);
  await expect(page.getByText('Test')).toBeVisible();

  const bridged = await bridge(1, 2);
  console.log('bridged', bridged);
  expect(bridged).toEqual({ browserValue: 1, runnerValue: 2, value: 2 });
});

test('stub', async ({ render }) => {
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
  expect(called1).toBe(1);
});

test.describe('extend', async () => {
  test.use({ path: '/foo/bar' });
  test('works', async ({ render }) => {
    const { page } = await render();
    await expect(page.getByText('Vite + React')).toBeVisible();
    expect(page.url()).toBe('http://localhost:5173/foo/bar');
  });
});
