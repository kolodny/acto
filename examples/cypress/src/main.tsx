import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { connectApp } from 'acto/connect-app';

const root = createRoot(document.getElementById('root')!);

connectApp({
  importGlob: import.meta.glob('../**/*.cy.{j,t}s{,x}'),
  render: async (elem) => root.render(elem),
  defaultElement: <App />,
});
