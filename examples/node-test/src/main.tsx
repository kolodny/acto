import React, { FunctionComponent, PropsWithChildren, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { connectApp } from 'acto/connect-app';

const root = createRoot(document.getElementById('root')!);

const resolveOnRender = (elem: JSX.Element) => {
  return new Promise<void>((res) => {
    const Component: FunctionComponent<PropsWithChildren> = (props) => {
      React.useEffect(res, []);
      return <>{props.children}</>;
    };
    root.render(<Component>{elem}</Component>);
  });
};

export const app = connectApp({
  importGlob: import.meta.glob('../**/*.test.{j,t}s{,x}'),
  render: async (elem) => resolveOnRender(elem),
  defaultElement: (
    <StrictMode>
      <App />
    </StrictMode>
  ),
});

export type ElementType = NonNullable<Awaited<typeof app>>['ElementType'];
