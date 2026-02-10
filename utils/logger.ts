type LogArgs = Parameters<typeof console.log>;

const isDev =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV !== 'production');

export const logger = {
  log: (...args: LogArgs) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: LogArgs) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};
