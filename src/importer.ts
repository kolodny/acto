/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore
import type { ImportGlobFunction } from 'vite';
import { state } from './browser';

export type Importer =
  // @ts-ignore
  | { webpackContext: false | webpack.Context }
  | { importGlob: false | ReturnType<ImportGlobFunction> }
  | { import: false | ((s: string) => Promise<unknown>) }
  | { imports: false | Record<string, () => Promise<unknown>> };

export const handleImporter = (options: Importer) => {
  state.connected = true;
  let known: string[] = [];
  let importer: (s: string) => unknown = () => {};
  if ('webpackContext' in options && options.webpackContext !== false) {
    const webpackContext = options.webpackContext;
    known = [...webpackContext.keys()];
    importer = webpackContext;
  } else if ('importGlob' in options && options.importGlob !== false) {
    const importGlob: any = options.importGlob;
    known = Object.keys(options.importGlob);
    importer = (s) => importGlob[s]?.();
  } else if ('imports' in options && options.imports !== false) {
    const imports = options.imports;
    known = Object.keys(imports);
    importer = (s) => imports[s]();
  } else if ('import' in options && options.import !== false) {
    importer = options.import;
  }

  return { known, importer };
};
