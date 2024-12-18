import { defineConfig } from 'cypress';
import * as createBundler from '@bahmutov/cypress-esbuild-preprocessor';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on) {
      on('file:preprocessor', createBundler());
    },
  },
});
