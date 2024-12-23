import { API_NAME } from './shared';
import { Importer } from './importer';
import { connectBrowser, getTestInfo as baseGetTestInfo } from './browser';

export type RenderComponent<T> = T | ((defaultElement: T) => T);
type Options<ElementType, Rendered> = Importer & {
  render: (component: ElementType) => Promise<Rendered>;
  defaultElement: ElementType;
};

export const getTestInfo = () => baseGetTestInfo((window as any)[API_NAME]);

export const connectApp = async <ElementType, Rendered>(
  options: Options<ElementType, Rendered>,
) => {
  const connected = await connectBrowser({
    ...options,
    callTestRunner: (window as any)[API_NAME],
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
