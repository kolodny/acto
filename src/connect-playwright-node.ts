import * as playwrightTest from '@playwright/test';
import type { Page } from '@playwright/test';

import { API_NAME } from './shared';

import { connectTest } from './test';
import { Bridge } from './types';
import { RenderComponent } from './connect-app';

export interface Rendered {
  page: Page;
  bridge: Bridge;
}

export interface Options {
  /** location of client entry point that calls connectPlaywright */
  bootstrappedAt: string;
}

export type Render<T = unknown> = (
  component?: RenderComponent<T>,
) => Promise<Rendered>;

export type PlayType<T> = ReturnType<typeof connectPlaywright<T>>;

export const connectPlaywright = <T>({ bootstrappedAt }: Options) => {
  const test = playwrightTest.test.extend<{ render: Render<T> }>({
    render: [
      async ({ page }, use, testInfo) => {
        const { render, handleMessage } = connectTest({
          bootstrappedAt,
          getTestInfo: async () => {
            const titlePath = testInfo.titlePath.slice(1);
            return { file: testInfo.file, titlePath };
          },
        });

        await page.exposeFunction(API_NAME, handleMessage);
        await page.goto('/');

        await use(async () => {
          const bridge = await render();
          return { page, bridge };
        });
      },
      {},
    ],
  });

  type Connected = Omit<typeof playwrightTest, 'test'> & { test: typeof test };
  const returns: Connected = { ...playwrightTest, test };
  return returns;
};
