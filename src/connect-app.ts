import { API_NAME } from './shared';
import { Importer } from './importer';
import {
  connectBrowser,
  getTestInfo as baseGetTestInfo,
  state,
} from './browser';

type RenderAsFunction<T> = (defaultElement: T) => T | Promise<T>;
export type RenderComponent<T> =
  NonNullable<T> extends Function
    ?
        | RenderAsFunction<NonNullable<T>>
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

export const connectApp = <ElementType, Rendered>(
  options: Options<ElementType, Rendered>,
) => {
  const { getTestsInfo, connected } = connectBrowser({
    ...options,
    callTestRunner: (window as any)[API_NAME],
  });

  const connect = async () => {
    const { test, testInfo, bootstrap, defaultRender } = await connected;
    if (testInfo) {
      await test?.({ bootstrap });
      const rendered = state.rendered as Awaited<Rendered>;
      return { rendered, testInfo, getTestInfo };
    } else {
      return { rendered: defaultRender, getTestInfo };
    }
  };

  const returns = { getTestsInfo, connected: connect() };
  type Returns = typeof returns & { ElementType: ElementType };
  return returns as Returns;
};
