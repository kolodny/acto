import { mount } from 'svelte';
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
  defaultElement: () => Promise.resolve(App),
});

export default app;
