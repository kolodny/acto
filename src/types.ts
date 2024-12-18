export type Payload =
  | { type: 'INIT' }
  | { type: 'READY' }
  | { type: 'BRIDGE'; browserValue: unknown[] };

/** Coordinate or pass a value from the browser to the node test runner. */
export type Bridge = <BrowserValue, RunnerValue>(
  /** Browser value to pass to the node test runner. */
  browserValue: BrowserValue | (() => BrowserValue),
  /** Value to pass back to the browser. */
  runnerValue: (
    /** The initial value sent from the browser. */
    browserValue: BrowserValue,
  ) => RunnerValue | Promise<RunnerValue>,
) => Promise<{ browserValue: BrowserValue; runnerValue: RunnerValue }>;
