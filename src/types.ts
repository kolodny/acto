export type Payload =
  | { type: 'INIT' }
  | { type: 'READY' }
  | { type: 'BRIDGE'; browserValue: unknown };

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

/** Coordinate or pass a value from the browser to the node test runner. */
export type Bridge = <BrowserValue, RunnerValue>(
  /** Browser value to pass to the node test runner. */
  browserValue: BrowserValue | (() => BrowserValue),
  /** Value to pass back to the browser. */
  runnerValue:
    | RunnerValue
    | ((
        /** The initial value sent from the browser. */
        browserValue: BrowserValue,
      ) => RunnerValue | Promise<RunnerValue>),
) => Promise<{
  browserValue: Awaited<BrowserValue>;
  runnerValue: Awaited<RunnerValue>;
  /** BrowserValue in the browser, RunnerValue in the node test runner. */
  value: Awaited<BrowserValue> | Awaited<RunnerValue>;
}>;
