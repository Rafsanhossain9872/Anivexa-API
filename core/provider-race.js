import { withDeadline } from './network.js';

// Race a small number of providers, refilling a slot whenever one fails.
// A result is usable only after operation has normalized/validated it.
export async function firstSuccessfulProvider(providers, operation, { concurrency = 3, timeout = 20000, signal } = {}) {
  const controller = new AbortController();
  const raceSignal = AbortSignal.any([controller.signal, signal].filter(Boolean));
  let next = 0;

  async function worker() {
    while (!raceSignal.aborted && next < providers.length) {
      const provider = providers[next++];
      try {
        const value = await withDeadline(attemptSignal => operation(provider, attemptSignal), timeout, raceSignal);
        if (value) return { provider, value };
      } catch { /* An unavailable provider frees a slot for the next fallback. */ }
    }
    throw new Error('No usable provider result');
  }

  try {
    return await Promise.any(Array.from({ length: Math.min(concurrency, providers.length) }, worker)).catch(() => null);
  } finally {
    controller.abort();
  }
}
