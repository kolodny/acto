import React from 'react';
// import { test, expect } from '@playwright/test';
import {
  connectPlaywright,
  env,
  isApp,
  isRunner,
} from 'acto/connect-playwright';
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

test('component test fn', async ({ render }) => {
  const { page } = await render(() => <div>Custom</div>);
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

  const bridged = await bridge(env, (app) => `${app} + ${env}`);
  expect(bridged).toEqual({
    browserValue: 'app',
    runnerValue: 'app + runner',
    value: 'app + runner',
  });

  const items = [isApp, isRunner];
  const bridged2 = await bridge([items], (app) => app.concat([items]));
  expect(bridged2).toEqual({
    browserValue: [true, false],
    runnerValue: [true, false, false, true],
    value: [true, false, false, true],
  });

  const stuff = await bridge(null, () => typeof process);
  await new Promise((r) => setTimeout(r, 100));

  console.log({ stuff });

  const stuff2 = await bridge({ b: typeof process }, (b) => ({ b }));
  await new Promise((r) => setTimeout(r, 100));
  const { runnerValue } = await bridge(null, () => `${process.env.PWDEBUG}`);
  expect(runnerValue).toBe('true');
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

  const bridgedValue = await bridge('browserValue', 'runnerValue');
  console.log('bridgedValue', bridgedValue);
  expect(bridgedValue).toEqual({
    browserValue: 'browserValue',
    runnerValue: 'runnerValue',
    value: 'runnerValue',
  });

  const bridgedFns = await bridge(
    () => 'browserValue',
    () => 'runnerValue',
  );
  console.log('bridgedFns', bridgedFns);
  expect(bridgedFns).toEqual({
    browserValue: 'browserValue',
    runnerValue: 'runnerValue',
    value: 'runnerValue',
  });

  const bridged = await bridge(
    async () => 'browserValue',
    async () => 'runnerValue',
  );
  console.log('bridged', bridged);
  expect(bridged).toEqual({
    browserValue: 'browserValue',
    runnerValue: 'runnerValue',
    value: 'runnerValue',
  });

  const bridged2 = await bridge(null, async () => 'runnerValue');
  console.log('bridged2', bridged2);
  expect(bridged2).toEqual({
    browserValue: null,
    runnerValue: 'runnerValue',
    value: 'runnerValue',
  });

  const bridged3 = await bridge(async () => 'browserValue', null);
  console.log('bridged3', bridged3);
  expect(bridged3).toEqual({
    browserValue: 'browserValue',
    runnerValue: null,
    value: null,
  });
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
