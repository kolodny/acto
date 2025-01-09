import { API_NAME } from './shared';
import { Importer } from './importer';
import { connectBrowser, getTestInfo as baseGetTestInfo } from './browser';

type RenderAsFunction<T> = (defaultElement: T) => T | Promise<T>;
export type RenderComponent<T> = T extends Function
  ?
      | RenderAsFunction<T>
      | {
          error: `You need to wrap the render in another function`;
          Example1: 'change `await render(() => <div>)` to `await render(() => () => <div>)`';
          Example2: 'change `await render(SvelteComponent)` to `await render(() => SvelteComponent)`';
        }
  : T | RenderAsFunction<T>;
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
