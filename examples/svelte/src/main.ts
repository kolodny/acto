import { mount, type Component } from 'svelte';
import './app.css';
import App from './App.svelte';

import { connectApp } from 'acto/connect-app';

export const app = await connectApp({
  importGlob: import.meta.glob('../tests/**/*.test.ts'),
  render: async (elem) => {
    const app = mount(await elem(), {
      target: document.getElementById('app')!,
    });
    return app;
  },
  defaultElement: async () => App as Component,
});

export type ElementType = NonNullable<typeof app>['ElementType'];

export default app;
