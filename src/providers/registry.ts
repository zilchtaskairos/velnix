/**
 * Velnix Provider Registry.
 *
 * Order matters: the router attempts providers in the order listed here and
 * returns the first success. Add a new provider to this array to make it
 * available; it is only actually attempted if its `enabled` flag is true.
 */

import "server-only";

import type { Provider } from "./types";

import { authorizedProvider } from "./authorized-provider";
import { demoProvider } from "./demo-provider";
import { sampleProvider } from "./sample-provider";

// Real/authorized providers first (they take priority when configured), then
// sample providers as a working fallback.
export const PROVIDERS: Provider[] = [
  authorizedProvider, // disabled until real credentials are supplied
  demoProvider, // enabled by default — public test stream
  sampleProvider, // disabled by default — demonstrates router fallback
];

export function enabledProviders(): Provider[] {
  return PROVIDERS.filter((p) => p.enabled);
}
