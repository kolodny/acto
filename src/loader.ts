import { createRequire, type LoadHook } from 'node:module';

export const load: LoadHook = async (url, context, nextLoad) => {
  const require = createRequire(new URL(url).pathname);
  const result = await nextLoad(url, context);

  const imports = /import\s+(?<what>.*?)\bfrom\s+['"](?<from>[^'"]*)['"]/gs;
  result.source = result.source?.toString().replaceAll(imports, (...args) => {
    const { what, from }: { what: string; from: string } = args.at(-1);
    try {
      require.resolve(from);
      return args[0];
    } catch {
      const vars = what.replace(/as\s+\w+/g, '');
      return `const ${vars} = await (import('${from}').catch(e => ({})));`;
    }
  });

  return result;
};
