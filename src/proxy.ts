/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
const GET = Symbol('GET');
const THEN = Symbol('then');
const RESOLVED = Symbol('resolved');
let proxyId = 1;
const proxyIds = new WeakMap();
const proxyApply = new WeakMap();
const proxyChildren = new WeakMap<object, WeakMap<object, any>>();
const str = (arr: any[]) => arr.map((a) => a.toString()).join('.');

export const APPLY = Symbol('apply');
export const makeProxy = (
  parent = undefined,
  path: any[] = [],
  inThen = false,
) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const proxy: any = new Proxy({ [str(path)]() {} }[str(path)], {
    apply: (_target, thisArg, args) => {
      if (proxyApply.has(proxy)) {
        return proxyApply.get(proxy).apply(thisArg, args);
      }
      if (inThen && typeof args[0] === 'function') {
        const [resolve] = args;

        Promise.resolve().then(() =>
          resolve(makeProxy(thisArg, path.concat(RESOLVED), true)),
        );
      } else {
        const nextPathItem: {
          args: any[];
          toString: () => string;
          thisArg?: any;
        } = {
          args,
          toString: () => JSON.stringify(nextPathItem),
        };
        if (thisArg !== parent) {
          nextPathItem.thisArg = thisArg;
        }
        return makeProxy(proxy, path.concat(nextPathItem));
      }
    },
    set: (_target, key, value) => {
      if (key === APPLY) {
        proxyApply.set(proxy, value);
        return true;
      }
      const children = proxyChildren.get(proxy);
      if (children) {
        children.set(key as never, value);
        return true;
      }
      return false;
    },
    get: (_target, key) => {
      if (key === GET) {
        return { path, parent };
      }
      if (key === Symbol.toPrimitive || key === 'toJSON') {
        return () => `Proxy: ${str(path)}`;
      }
      const children = proxyChildren.get(proxy);
      if (children?.has(key as never)) {
        return children.get(key as never);
      }
      if (key === 'then') {
        if (inThen) {
          return undefined;
        }

        const child = makeProxy(proxy, path.concat(THEN), true);
        children?.set(key as never, child);
        return child;
      }
      const child = makeProxy(proxy, path.concat(key));
      children?.set(key as never, child);
      return child;
    },
  });

  proxyIds.set(proxy, proxyId++);
  proxyChildren.set(proxy, new Map());
  return proxy;
};
