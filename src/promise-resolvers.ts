interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export const withResolvers: <T>() => PromiseWithResolvers<T> =
  'withResolvers' in Promise
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((Promise as any).withResolvers.bind(Promise) as never)
    : <T>() => {
        const resolvers = {} as PromiseWithResolvers<T>;
        resolvers.promise = new Promise((resolve, reject) =>
          Object.assign(resolvers, { resolve, reject }),
        );
        return resolvers;
      };
