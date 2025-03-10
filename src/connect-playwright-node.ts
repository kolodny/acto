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
  /** `@playwright/test` package. Useful when test is already extended */
  playwright?: typeof playwrightTest;
}

export type Render<T = unknown> = (
  component?: RenderComponent<T>,
) => Promise<Rendered>;

export type PlayType<T> = ReturnType<typeof connectPlaywright<T>>;

export const connectPlaywright = <T>({
  bootstrappedAt,
  playwright = playwrightTest,
}: Options) => {
  const test = playwright.test.extend<{ render: Render<T>; path: string }>({
    path: '/',
    render: [
      async ({ page, path }, use, testInfo) => {
        const { render, handleMessage } = connectTest({
          bootstrappedAt,
          getTestInfo: async () => {
            const titlePath = testInfo.titlePath.slice(1);
            return { file: testInfo.file, titlePath };
          },
        });

        await page.exposeFunction(API_NAME, handleMessage);
        await page.goto(path);

        await use(async () => {
          const bridge = await render();
          return { page, bridge };
        });
      },
      {},
    ],
  });

  const playwrightNoTest: Omit<typeof playwright, 'test'> = playwright;
  return { ...playwrightNoTest, test };
};

export const env: 'runner' | 'app' = 'runner';
export const isRunner: boolean = true;
export const isApp: boolean = false;
