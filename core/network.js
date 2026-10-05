import { AsyncLocalStorage } from 'node:async_hooks';

const context = new AsyncLocalStorage();

export function withRequestBudget(operation, maximum = 150, waitUntil, signal) {
  return context.run({ budget: { remaining: maximum }, waitUntil, signal }, operation);
}

export function registerBackground(promise) {
  context.getStore()?.waitUntil?.(promise);
}

export function getRequestSignal() {
  return context.getStore()?.signal;
}

export function providerFetch(url, options = {}) {
  const current = context.getStore();
  if (current?.signal?.aborted) return Promise.reject(current.signal.reason);
  if (current?.budget && --current.budget.remaining < 0) return Promise.reject(new Error('Provider request budget exhausted'));
  const timeout = AbortSignal.timeout(12000);
  const signals = [options.signal, current?.signal, timeout].filter(Boolean);
  const signal = AbortSignal.any(signals);
  return globalThis.fetch(url, { ...options, signal });
}

export async function withDeadline(operation, milliseconds = 20000, parentSignal) {
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, getRequestSignal(), parentSignal].filter(Boolean));
  signal.throwIfAborted();
  const timer = setTimeout(() => controller.abort(new Error('Provider timed out')), milliseconds);
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await context.run({ ...context.getStore(), signal }, () => Promise.race([Promise.resolve().then(() => {
      signal.throwIfAborted();
      return operation(signal);
    }), aborted]));
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}
