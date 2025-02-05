import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

import { connectApp } from 'acto/connect-app';

export const connected = connectApp({
  importGlob: import.meta.glob('../tests/**/*.test.ts'),
  render: async (elem) => {
    const app = mount(await elem(), {
      target: document.getElementById('app')!,
    });
    return app;
  },
  defaultElement: async () => App,
});

export type ElementType = Awaited<typeof connected>['ElementType'];
