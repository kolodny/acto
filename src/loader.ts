import { createRequire, isBuiltin, type LoadHook } from 'node:module';

const proxy = `new Proxy({}, { get: (t, k) => \`export '\${k}' can't load in NodeJS. This fallback string value is used instead.\` })`;

export const load: LoadHook = async (url, context, nextLoad) => {
  const result = await nextLoad(url, context);
  if (isBuiltin(url)) {
    return result;
  }

  try {
    const require = createRequire(new URL(url).pathname);

    const imports =
      /import\b(?<what>[^"']*?)\bfrom\s*['"](?<from>[^'"]*)['"]/gs;
    result.source = result.source?.toString().replaceAll(imports, (...args) => {
      const { what, from }: { what: string; from: string } = args.at(-1);
      try {
        require.resolve(from);
        return args[0];
      } catch {
        const vars = what
          .replace(/\*\s+as\s+(\w+)/g, '$1')
          .replace(/as\s+\w+/g, '');
        return `const ${vars} = await (import('${from}').catch(() => ${proxy}));`;
      }
    });
  } catch {}
  return result;
};
