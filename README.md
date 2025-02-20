<h1 align="center">acto</h1>

<p align="center">connector for e2e test runners</p>

<p align="center">
	<a href="https://github.com/kolodny/acto/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg"></a>
	<a href="http://npmjs.com/package/acto"><img alt="📦 npm version" src="https://img.shields.io/npm/v/acto?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
	<a href="https://github.com/kolodny/acto/actions"><img src="https://github.com/kolodny/acto/actions/workflows/test.yml/badge.svg?branch=main" /></a>
</p>

## Installation

```shell
npm i acto
```

Acto is a connector to enable easily creating component tests within a variety of e2e test runners. The two main parts are the app connector and test connector.

## App Connectors

You'll need to use the `connectApp` function from `acto/connect-app` when bootstrapping your app (instead of, for example  
`createRoot(document.getElementById('root')!).render(...)` in `React` or `mount(App)` in `Svelte` etc). This function takes a property that allows the test code to be imported dynamically (which will not have any impact on the app bundle). You'll probably use `importGlob` if you're using vite as your bundler, but other flavors are supported as well. You may need to change the glob pattern to match your test files.

```tsx
// src/main.tsx
import { connectApp } from 'acto/connect-app';

connectApp({
  // When using vite:
  importGlob: import.meta.glob('./**/*.test.{j,t}s{,x}'),

  // When using webpack:
  webpackContext: import.meta.webpackContext('.', {
    recursive: true,
    regExp: /\.test$/,
    mode: 'lazy',
  }),

  // When using a bundler that doesn't handle globbing:
  imports: {
    './App.test.tsx': () => import('./App.test.tsx'),
    './OtherComponent.test.tsx': () => import('./OtherComponent.test.tsx'),
  },

  // These values are the same regardless of the bundler you're using
  render: async (elem) => {
    const root = createRoot(document.getElementById('root')!);
    root.render(elem);
  },
  defaultElement: <App />,
});
```

## Test Connectors

The test connectors are available for:

- [`@playwright/test`](https://playwright.dev/docs/intro): `import { connectPlaywright } from 'acto/connect-playwright'`
- [`Cypress`](https://www.cypress.io/): `import { connectCypress } from 'acto/connect-cypress'`
- [Node Test Runner](https://nodejs.org/api/test.html): `import { connectNodeTest } from 'acto/connect-node-test'`
  - Take a look at the [examples](./examples/node-test/tests/) to see how `connectNodeTest` is wired up for `puppeteer` or `playwright`.

<details>
<summary>Using <code>@playwright/test</code></summary>

```ts
// tests/playwright.spec.tsx
import React from 'react';
import { connectPlaywright } from 'acto/connect-playwright';

const { test, expect } = connectPlaywright({
  bootstrappedAt: import.meta.resolve('../src/main.tsx'),
});

test('app test', async ({ render }) => {
  const { page } = await render();
  await expect(page.getByText('Vite + React')).toBeVisible();
});

test('component test', async ({ render }) => {
  const { page } = await render(<div>Custom</div>);
  await expect(page.getByText('Custom')).toBeVisible();
});

```

</details>

<details>
<summary>Using <code>cypress</code></summary>

```tsx
// cypress/e2e/spec.cy.tsx
import React from 'react';
import { connectCypress } from 'acto/connect-cypress';

const { render, describe, it, cy } = connectCypress({
  bootstrappedAt: '../../src/main.tsx',
});

describe('my tests', () => {
  it('tests app', () => {
    render();

    cy.contains('Vite + React').should('be.visible');
  });

  it('tests components', async ({ render }) => {
    const { page } = await render(<div>Custom</div>);
    await expect(page.getByText('Custom')).toBeVisible();
  });
});
```

</details>

<details>
<summary>Using Node Test Runner</summary>

- See example that uses [`playwright`](./examples/node-test/tests/playwright.test.tsx)
- See example that uses [`puppeteer`](./examples/node-test/tests/puppeteer.test.tsx)

</details>

## Register Hook

Sometimes you can have some UI code that won't be able to run in the NodeJS environment. In that case, you can import the `acto/register` hook in your test runner. This will patch the imports with dummy values within NodeJS. For example, if the component file has a line like:  
`const API = window.location.hostname.includes === 'test' ? 'test' : 'prod'` this will fail since `window` isn't defined in Node. By importing the `acto/register` hook, this code will be able to run in Node.

### Using `@playwright/test`:

```ts
// playwright.config.ts
import 'acto/register';
import { defineConfig, devices } from '@playwright/test';
```

### Using `Node Test Runner` change your `package.json` to include the following:

```json
{
  "scripts": {
    "old-test": "node --import tsx --test $(glob 'tests/**/*.tsx')",
    "new-test": "node --import tsx --import acto/register --test $(glob 'tests/**/*.tsx')"
  }
}
```

Make sure that `--import acto/register` comes after `--import tsx` for best results.
