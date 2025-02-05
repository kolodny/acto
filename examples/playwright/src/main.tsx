import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { connectApp } from 'acto/connect-app';

const root = createRoot(document.getElementById('root')!);

export const connected = connectApp({
  importGlob: import.meta.glob('../**/*.spec.{j,t}s{,x}'),
  render: async (elem) => root.render(elem),
  defaultElement: (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ),
});

export type ElementType = Awaited<typeof connected>['ElementType'];
