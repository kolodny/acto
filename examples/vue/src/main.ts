import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

import { connectApp } from 'acto/connect-app';

export const app = await connectApp({
  importGlob: import.meta.glob('../tests/**/*.test.ts'),
  render: async (elem) => {
    const app = createApp(await elem()).mount('#app');
    return app;
  },
  defaultElement: () => Promise.resolve(App),
});
