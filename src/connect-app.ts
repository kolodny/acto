import { API_NAME } from './shared';
import { Importer } from './importer';
import { BRIDGE_SYNC, connectBrowser } from './browser';

export type RenderComponent<T> = T | ((defaultElement: T) => T);
type Options<ElementType, Rendered> = Importer & {
  render: (component: ElementType) => Promise<Rendered>;
  defaultElement: ElementType;
};

const LOCAL_RUNNER =
  "Bridge function was called, however the there's no active test runner. You can manually call the bridge function. eg: `bridge(browserValue => browserValue.toUpperCase())`";

export const connectApp = async <ElementType, Rendered>(
  options: Options<ElementType, Rendered>,
) => {
  const connected = await connectBrowser({
    ...options,
    callTestRunner: async (payload?) => {
      const api = (window as any)[API_NAME];

      const handleLocally =
        payload?.type === 'BRIDGE' &&
        payload?.browserValue !== BRIDGE_SYNC &&
        !api;

      if (handleLocally) {
        console.info(LOCAL_RUNNER);

        return new Promise((resolve) => {
          (window as any).bridge = async (runnerValue: (value: any) => any) => {
            delete (window as any).bridge;
            const isFn = typeof runnerValue === 'function';
            const ran = isFn ? runnerValue(payload.browserValue) : runnerValue;
            resolve(await ran);
          };
        });
      }
      return api?.(payload);
    },
  });
  if (connected && connected.testInfo) {
    const { test, testInfo, bootstrap } = connected;
    console.log(`Running ${testInfo.test}`);
    await test({ bootstrap });
  } else {
    const returns = { rendered: connected.defaultRender };
    type Returns = typeof returns & { ElementType: ElementType };
    return returns as Returns;
  }
};
