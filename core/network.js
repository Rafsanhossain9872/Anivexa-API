import { AsyncLocalStorage } from 'node:async_hooks';

const context = new AsyncLocalStorage();

export function withRequestBudget(operation, maximum = 150, waitUntil) {
  return context.run({ budget: { remaining: maximum }, waitUntil }, operation);
}

export function registerBackground(promise) {
  context.getStore()?.waitUntil?.(promise);
}

export function providerFetch(url, options = {}) {
  const current = context.getStore();
  if (current?.budget && --current.budget.remaining < 0) return Promise.reject(new Error('Provider request budget exhausted'));
  const timeout = AbortSignal.timeout(12000);
  const signals = [options.signal, current?.signal, timeout].filter(Boolean);
  const signal = AbortSignal.any(signals);
  return globalThis.fetch(url, { ...options, signal });
}

export async function withDeadline(operation, milliseconds = 20000) {
  let timer;
  const controller = new AbortController();
  try {
    return await context.run({ ...context.getStore(), signal: controller.signal }, () => Promise.race([operation(), new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Provider timed out')); }, milliseconds); })]));
  } finally { clearTimeout(timer); }
}
