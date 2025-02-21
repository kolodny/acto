<h1 align="center">Acto</h1>

<p align="center">Run Component Tests within your End-To-End (E2E) Test Runner</p>

<p align="center">
	<a href="https://github.com/kolodny/acto/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg"></a>
	<a href="http://npmjs.com/package/acto"><img alt="📦 npm version" src="https://img.shields.io/npm/v/acto?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="💪 TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
	<a href="https://github.com/kolodny/acto/actions"><img src="https://github.com/kolodny/acto/actions/workflows/test.yml/badge.svg?branch=main" /></a>
</p>

## Introduction

Acto is a powerful tool designed to streamline component testing by utilizing your existing End-To-End (E2E) test runner. Unlike other component testing solutions that require complex configurations in a separate execution context and additional tooling, Acto enables you to reuse your current E2E configuration to render specific components during testing. This approach minimizes tooling fatigue and reduces potential failure points, providing a seamless and efficient testing experience. Acto integrates with popular E2E frameworks like Playwright, Cypress, and Node's Test Runner (with any BYO browser tester), enhancing your testing workflow without introducing new paradigms.

## Installation

To install Acto, use npm:

```sh
npm i acto
```

## App Connectors

Acto provides an `App Connector` to help you set up your application for testing. You will need to use the `connectApp` function from `acto/connect-app` when bootstrapping your app. This replaces the typical setup code you might use in frameworks like React or Svelte.

### Example

```tsx
// src/main.tsx
import { connectApp } from 'acto/connect-app';

// Use connectApp to set up your application for testing
connectApp({
  // When using vite use this property:
  importGlob: import.meta.glob('./**/*.test.{j,t}s{,x}'),

  // When using Webpack use this property:
  webpackContext: import.meta.webpackContext('.', {
    recursive: true,
    regExp: /\.test$/,
    mode: 'lazy',
  }),

  // For bundlers without automatic globbing, specify the imports manually:
  imports: {
    './App.test.tsx': () => import('./App.test.tsx'),
    './OtherComponent.test.tsx': () => import('./OtherComponent.test.tsx'),
  },

  // These values are the same regardless of the bundler you're using:
  defaultElement: <App />,
  render: async (elem) => {
    // Here is where your usual app rendering code goes:
    const root = createRoot(document.getElementById('root')!);
    root.render(elem);
  },
});
```

## Test Connectors

Acto provides test connectors for various testing frameworks. These connectors help you integrate your tests with the framework of your choice.

### Using Acto with Playwright

```tsx
// tests/playwright.spec.tsx
import React from 'react';
import { connectPlaywright } from 'acto/connect-playwright';

// Set up Playwright with Acto
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

### Using Acto with Cypress

```tsx
// cypress/E2E/spec.cy.tsx
import React from 'react';
import { connectCypress } from 'acto/connect-cypress';

// Set up Cypress with Acto
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

### Using Node Test Runner

- See example that uses [`playwright`](./examples/node-test/tests/playwright.test.tsx)
- See example that uses [`puppeteer`](./examples/node-test/tests/puppeteer.test.tsx)

## Register Hook

Sometimes, you may have UI code that can't run in NodeJS. In such cases, you can import the `acto/register` hook in your test runner. This hook patches those files' exports with dummy `string` values within NodeJS, allowing your code to run without errors. For example, if your component file has code like:

```ts
const API = window.location.hostname.includes('test') ? 'test' : 'prod';
```

This would normally fail since `window` isn't defined in NodeJS. By importing the `acto/register` hook, this code will be able to run in NodeJS.

### Using `@playwright/test`:

```ts
// playwright.config.ts
import 'acto/register';
import { defineConfig, devices } from '@playwright/test';
```

### Using Node Test Runner

Modify your `package.json` to include the following script:

```json
{
  "scripts": {
    "test-old": "node --import tsx --test $(glob 'tests/**/*.tsx')",
    "test-new": "node --import tsx --import acto/register --test $(glob 'tests/**/*.tsx')"
  }
}
```

Ensure that `--import acto/register` comes after `--import tsx` for best results.
